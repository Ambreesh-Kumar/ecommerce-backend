import express from "express";

const router = express.Router();

router.get("/payment-cancelled", (req, res) => {
  res.status(200).send(`
    <h2>Payment Cancelled</h2>
    <p>You closed the Razorpay payment window.</p>
    <p>You may safely close this tab.</p>
  `);
});

router.get("/payment-failed", (req, res) => {
  res.status(200).send(`
    <h2>Payment Failed</h2>
    <p>Something went wrong during payment.</p>
    <p>You may safely close this tab.</p>
  `);
});

router.get("/payment-success", (req, res) => {
  res.status(200).send(`
    <h2>Payment Successful</h2>
    <p>Your payment was completed successfully.</p>
    <p>You may safely close this tab.</p>
  `);
});

export default router;
