## Frontend

The standalone frontend is in the `frontend/` directory. Start the API first, then serve the frontend from that directory so the browser can load its files:

```bash
cd frontend
python -m http.server 5500
```

Open http://127.0.0.1:5500. The default API URL and key match this backend, and both can be changed in the request setup panel.