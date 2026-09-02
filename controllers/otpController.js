const transporter = require("../config/mailer");

let otpStore = {}; // Store OTPs temporarily

// Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!otpStore[email] || otpStore[email] != otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  delete otpStore[email]; // Remove OTP after verification
  res.json({ message: "OTP verified successfully" });
};
