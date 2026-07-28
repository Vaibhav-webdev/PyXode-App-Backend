import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_WEB_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'idToken nahi mila.',
      });
    }

    // STEP 1: Google Token Verify Karo
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Google payload se required fields nikalein
    const { 
      sub: googleId, 
      email, 
      given_name, 
      family_name, 
      picture,
      name 
    } = payload;

    // STEP 2: Database me Check/Create Karo (Schema fields ke hisaab se)
    let user = await User.findOne({ googleId });

    if (!user) {
      // Schema ke `firstName`, `lastName`, aur `image` fields me map kar rahe hain
      user = await User.create({
        googleId,
        email,
        firstName: given_name || name?.split(' ')[0] || '',
        lastName: family_name || name?.split(' ').slice(1).join(' ') || '',
        image: picture || '',
      });
      console.log('New user created in MongoDB:', email);
    } else {
      console.log('Existing user logged in:', email);
    }

    // STEP 3: Session JWT Generate Karo
    const appToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // STEP 4: Response Bhejo
    return res.status(200).json({
      success: true,
      token: appToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or Expired Google Token',
    });
  }
});

export default router;
