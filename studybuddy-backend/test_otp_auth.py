import json
import unittest
from app import app
from models import db, User, PendingRegistration


class TestOTPAuth(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            # Clean up test accounts if any
            User.query.filter(User.username.in_(["test_otp_user", "test_user2"])).delete()
            PendingRegistration.query.filter(PendingRegistration.email.in_(["test@example.com", "test2@example.com"])).delete()
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            User.query.filter(User.username.in_(["test_otp_user", "test_user2"])).delete()
            PendingRegistration.query.filter(PendingRegistration.email.in_(["test@example.com", "test2@example.com"])).delete()
            db.session.commit()

    def test_send_otp_validation(self):
        # Missing email
        res = self.client.post("/api/auth/send-otp", json={
            "username": "test_otp_user",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("email", res.get_json()["error"].lower())

        # Invalid email format
        res = self.client.post("/api/auth/send-otp", json={
            "username": "test_otp_user",
            "email": "not-an-email",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 400)

        # Valid payload
        res = self.client.post("/api/auth/send-otp", json={
            "username": "test_otp_user",
            "email": "test@example.com",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()["success"])

        # Check pending registration in DB
        with self.app.app_context():
            pending = PendingRegistration.query.filter_by(email="test@example.com").first()
            self.assertIsNotNone(pending)
            self.assertEqual(len(pending.otp_code), 6)
            self.assertEqual(pending.username, "test_otp_user")

    def test_verify_otp_flow(self):
        # Step 1: Send OTP
        res = self.client.post("/api/auth/send-otp", json={
            "username": "test_otp_user",
            "email": "test@example.com",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 200)

        # Retrieve OTP from database
        with self.app.app_context():
            pending = PendingRegistration.query.filter_by(email="test@example.com").first()
            otp = pending.otp_code

        # Step 2: Try with wrong OTP
        wrong_res = self.client.post("/api/auth/verify-otp", json={
            "email": "test@example.com",
            "otp": "000000"
        })
        self.assertEqual(wrong_res.status_code, 400)
        self.assertIn("Invalid verification code", wrong_res.get_json()["error"])

        # Step 3: Try with correct OTP
        verify_res = self.client.post("/api/auth/verify-otp", json={
            "email": "test@example.com",
            "otp": otp
        })
        self.assertEqual(verify_res.status_code, 201)
        data = verify_res.get_json()["data"]
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["username"], "test_otp_user")
        self.assertEqual(data["user"]["email"], "test@example.com")

        # Verify user is in User table
        with self.app.app_context():
            user = User.query.filter_by(email="test@example.com").first()
            self.assertIsNotNone(user)
            self.assertTrue(user.check_password("password123"))

            # Pending record should be cleaned up
            pending_after = PendingRegistration.query.filter_by(email="test@example.com").first()
            self.assertIsNone(pending_after)


if __name__ == "__main__":
    unittest.main()
