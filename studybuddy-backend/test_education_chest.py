import unittest
import json
from app import app, db
from models import User, Doubt, StudyCircle

class EducationChestIntegrationTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = self.app.test_client()

    def test_01_seed_and_login(self):
        res = self.client.post("/api/seed")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])

        # Login as demo
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        self.assertEqual(login_res.status_code, 200)
        login_data = login_res.get_json()
        self.assertTrue(login_data["success"])
        self.assertIn("access_token", login_data["data"])
        self.token = login_data["data"]["access_token"]

    def test_02_impact_stats(self):
        res = self.client.get("/api/admin/impact-stats")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertGreater(len(data["data"]["headline_metrics"]), 0)

    def test_03_doubt_solving_and_journal(self):
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        token = login_res.get_json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Solve doubt
        res = self.client.post("/api/doubts/solve", json={
            "question_text": "How do I solve 2x + 5 = 15?",
            "subject": "Mathematics",
            "save_to_journal": True
        }, headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        self.assertIn("steps", data["data"])

        # Fetch doubts
        doubts_res = self.client.get("/api/doubts", headers=headers)
        self.assertEqual(doubts_res.status_code, 200)
        d_data = doubts_res.get_json()
        self.assertTrue(d_data["success"])
        self.assertGreaterEqual(len(d_data["data"]), 1)

    def test_04_study_circles_and_gamification(self):
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        token = login_res.get_json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # List circles
        res = self.client.get("/api/circles", headers=headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data["success"])
        circles = data["data"]
        self.assertGreater(len(circles), 0)
        first_circle_id = circles[0]["id"]

        # Post message
        msg_res = self.client.post(f"/api/circles/{first_circle_id}/messages", json={
            "text": "Hello peers! Let's study."
        }, headers=headers)
        self.assertEqual(msg_res.status_code, 201)

        # Post doubt in circle
        doubt_res = self.client.post(f"/api/circles/{first_circle_id}/doubts", json={
            "title": "Need help with polynomial roots",
            "question_text": "What is the quadratic formula?"
        }, headers=headers)
        self.assertEqual(doubt_res.status_code, 201)
        created_doubt_id = doubt_res.get_json()["data"]["id"]

        # Answer the doubt
        ans_res = self.client.post(f"/api/circles/doubts/{created_doubt_id}/answers", json={
            "answer_text": "x = (-b +- sqrt(b^2 - 4ac)) / (2a)"
        }, headers=headers)
        self.assertEqual(ans_res.status_code, 201)
        created_ans_id = ans_res.get_json()["data"]["id"]

        # Upvote answer
        upvote_res = self.client.post(f"/api/circles/answers/{created_ans_id}/upvote", headers=headers)
        self.assertEqual(upvote_res.status_code, 200)

        # Leaderboard
        lb_res = self.client.get("/api/circles/leaderboard")
        self.assertEqual(lb_res.status_code, 200)
        lb_data = lb_res.get_json()
        self.assertTrue(lb_data["success"])

    def test_05_smart_planner(self):
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        token = login_res.get_json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Generate plan
        plan_res = self.client.post("/api/planner/generate", json={
            "target_exam": "Midterm Exam",
            "daily_hours": 2,
            "subjects": ["Mathematics", "Physics"]
        }, headers=headers)
        self.assertEqual(plan_res.status_code, 200)
        p_data = plan_res.get_json()
        self.assertTrue(p_data["success"])
        self.assertGreaterEqual(len(p_data["data"]["days"]), 1)

    def test_06_parent_report_multilingual(self):
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        token = login_res.get_json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # English
        res_en = self.client.get("/api/parent-report?lang=en", headers=headers)
        self.assertEqual(res_en.status_code, 200)
        data_en = res_en.get_json()
        self.assertTrue(data_en["success"])
        self.assertIn("whatsapp_url", data_en["data"])

        # Hindi
        res_hi = self.client.get("/api/parent-report?lang=hi", headers=headers)
        self.assertEqual(res_hi.status_code, 200)
        data_hi = res_hi.get_json()
        self.assertTrue(data_hi["success"])

    def test_07_subscription(self):
        login_res = self.client.post("/api/auth/login", json={
            "username": "demo",
            "password": "demo123"
        })
        token = login_res.get_json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Status
        res = self.client.get("/api/subscription/status", headers=headers)
        self.assertEqual(res.status_code, 200)

        # Upgrade
        up_res = self.client.post("/api/subscription/upgrade", headers=headers)
        self.assertEqual(up_res.status_code, 200)
        up_data = up_res.get_json()
        self.assertEqual(up_data["tier"], "supporter")

if __name__ == "__main__":
    unittest.main()
