# Lambda Learning Project

This project is divided into three main parts:

1. **Backend**: Contains the Python-based backend services.
2. **Frontend**: Contains the React-based frontend application.
3. **Infrastructure**: Contains the AWS CDK infrastructure as code.

## Prerequisites

Ensure you have the following installed:

- Node.js (v16 or later)
- Python (v3.8 or later)
- AWS CLI (for deploying infrastructure)
- CDK CLI (for managing AWS CDK stacks)

---

## Commands

### Backend

Navigate to the `backend` directory:

```powershell
cd backend
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run the backend using Uvicorn:

```powershell
uvicorn main:app --reload
```

### Frontend

Navigate to the `frontend` directory:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Run the development server:

```powershell
npm run dev
```

Build the frontend for production:

```powershell
npm run build
```

### Infrastructure

Navigate to the `infrastructure` directory:

```powershell
cd infrastructure
```

Install dependencies:

```powershell
npm install
```

Synthesize the CloudFormation template:

```powershell
cdk synth
```

Deploy the stack:

```powershell
cdk deploy
```

Destroy the stack:

```powershell
cdk destroy
```

---

## Notes

- Ensure AWS credentials are configured before deploying the infrastructure.
- Use `npm run dev` for frontend development and `uvicorn main:app --reload` for backend development.
- For infrastructure, always test changes locally using `cdk synth` before deploying.