# Arin's Study Diary

Private study planner for Arin (HSC → medical / engineering).

## Architecture

| Layer | Service |
|-------|---------|
| Frontend | **Vercel** — Next.js UI |
| API | **AWS Lambda** + **API Gateway** (`backend/`) |
| AI | **Amazon Bedrock** (Claude vision) |
| Database | **MongoDB Atlas free** (Cluster0 · `ap-south-1`) |
| Photos | MongoDB **GridFS** (`notebook_photos`) |
| Auth | Invite-only email/password → JWT (`APP_JWT_SECRET`) |

```text
Browser → API Gateway → Lambda → Bedrock
                         Lambda → MongoDB Atlas
```

## Quick start (demo)

```bash
cp .env.example .env
# keep NEXT_PUBLIC_DEMO_MODE=true
npm install
npm run dev
```

No MongoDB password needed for demo UI.

## Configure MongoDB Atlas

1. Open root [`.env`](.env) (gitignored).
2. Replace `YOUR_DB_PASSWORD` in `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://neamul_db_user:YOUR_DB_PASSWORD@cluster0.avcswji.mongodb.net/arins_study_diary?retryWrites=true&w=majority
MONGODB_DB_NAME=arins_study_diary
```

3. URL-encode special characters in the password (`@` → `%40`, etc.).
4. In Atlas → Network Access, allow your IP (and later `0.0.0.0/0` for Lambda if needed).
5. Put the same URI in **AWS Secrets Manager** for Lambda (do not bake passwords into git).

Also set invite logins in `.env`:

```env
APP_JWT_SECRET=long-random-string
ARIN_EMAIL=...
ARIN_PASSWORD=...
EMON_EMAIL=...
EMON_PASSWORD=...
```

On first login, Lambda seeds the two user documents in MongoDB (roles `arin` / `emon`).

## Frontend env (`.env.local`)

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_API_BASE_URL=https://YOUR_API.execute-api.ap-south-1.amazonaws.com
```

## Deploy Lambda (only when you ask)

```bash
cd backend
npm install && npm run build

sam deploy \
  --template-file template.yaml \
  --stack-name arins-study-diary-api \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --parameter-overrides \
    MongoDbUri='mongodb+srv://...' \
    MongoDbName=arins_study_diary \
    AppJwtSecret='...' \
    ArinEmail='...' \
    ArinPassword='...' \
    EmonEmail='...' \
    EmonPassword='...' \
    AllowedOrigin='https://your-app.vercel.app'
```

Enable Bedrock model access in `ap-south-1` (or your chosen region) first.

### API routes

| Method | Path | Who |
|--------|------|-----|
| POST | `/auth/login` | public (invite users only) |
| GET | `/auth/me` | authed |
| POST | `/extract` | Arin |
| POST | `/upload` | Arin |
| POST | `/plans/confirm` | Arin |
| GET | `/plans/today` | Arin |
| PATCH | `/tasks/{id}` | Arin |
| POST | `/rewards/claim` | Arin |
| POST | `/rewards/fulfill` | Emon |
| GET/POST | `/encouragement` | both / Emon write |
| GET | `/photos/{fileId}` | Arin only |

## Scripts

```bash
npm run lint && npm run typecheck && npm run build
npm run backend:build && npm run backend:typecheck
```

## Notes

- Supabase is no longer required; Postgres migrations under `supabase/` are legacy reference only.
- Demo mode never writes to Atlas.
- Do **not** deploy or share invites until you explicitly ask.
