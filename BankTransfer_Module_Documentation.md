# Bank Transfer & Proof of Payment Module Documentation

## 1. Overview
This document details the implementation of the **Bank Transfer Payment Method** for the Student Finance System. This feature allows students to pay their fees via bank transfer and upload a proof of payment (PDF/Image) for verification by the finance department.

The system now supports a **Pending Verification** state, ensuring that bank transfers do not immediately deduct from the student's outstanding balance until approved.

---

## 2. Feature Workflows

### A. Student Payment Flow
1. **Selection**: Student navigates to "Make Payment" and selects "Bank Transfer".
2. **Details**: System displays University Bank Account details (Static info).
3. **Input**:
   - **Transaction Reference Number**: Mandatory field.
   - **Proof of Payment**: Mandatory file upload (PDF, PNG, JPG, Max 5MB).
4. **Submission**:
   - Data is sent as `multipart/form-data`.
   - Payment record is created with status **PENDING**.
   - **Dues Balance is NOT updated** immediately.
5. **Confirmation**:
   - Student is redirected to the Receipt page.
   - Receipt shows **"Payment Under Review"** (Yellow status).
   - Helper text informs the student of the verification process.

### B. Verification Flow (Backend Logic)
- **Immediate Card Payments**: Status = `RECEIVED`, Balance Updated `Immediately`.
- **Bank Transfers**: Status = `PENDING`, Balance Updated `Only after Admin Approval` (Admin approval flow to be implemented in future phase).

---

## 3. Technical Implementation

### A. Backend (`/backend`)

#### 1. Database Schema (`models.py`)
Updated `Payment` model to include:
- `proof_document` (String): Stores relative path to the uploaded file.
- `payment_method`: Now handles 'BANK_TRANSFER' explicitly.
- `status`: Now handles 'PENDING'.

#### 2. API Endpoints (`routes/students.py`)
**`POST /api/students/pay`**
- **Enhanced to support `multipart/form-data`**:
  - Checks for `proof_document` file in request.
  - Validates file extensions (`.pdf`, `.png`, `.jpg`, `.jpeg`).
  - Saves file to `backend/uploads/payments/` with timestamped unique filename.
- **Conditional Logic**:
  - If `payment_method == 'BANK_TRANSFER'`:
    - Sets `status = 'PENDING'`.
    - Skips `dues_balance` reduction.
  - If `payment_method == 'ONLINE'/'MANUAL'`:
    - Sets `status = 'RECEIVED'`.
    - Deducts amount from `dues_balance`.

### B. Frontend (`/frontend`)

#### 1. Service Layer (`studentService.js`)
- Updated `makePayment` function to accept an optional `proofFile`.
- Automatically constructs `FormData` object if a file is present, ensuring correct `Content-Type` headers for file upload.

#### 2. Make Payment Page (`MakePayment.jsx` & `.css`)
- **UI Updates**:
  - Added "Bank Transfer" card to payment method selection.
  - Added "Bank Details" section (Bank Name, Account #, Routing #).
  - Added "File Upload" area with drag-and-drop styling.
  - Added "Reference Number" input field.
  - Form validation: Ensures file and reference number are present for bank transfers.

#### 3. Payment Receipt (`PaymentReceipt.jsx` & `.css`)
- **Dynamic Status Display**:
  - Detects `PENDING` status.
  - **Pending State**: 
    - Yellow Theme.
    - Title: "Payment Under Review".
    - Badge: "Pending Verification".
  - **Success State**: 
    - Green Theme.
    - Title: "Payment Successful".
    - Badge: "Completed".

#### 4. Payment History (`PaymentHistory.jsx`)
- Updated table to display "Bank Transfer" correctly.
- Status badges reflect 'Pending' vs 'Paid'.

---

## 4. File Structure Changes

### Modified Files:
- `backend/models.py`: Schema update.
- `backend/routes/students.py`: Logic update.
- `backend/seed.py`: Database re-seeding to apply schema.
- `frontend/src/services/studentService.js`: API integration.
- `frontend/src/pages/student/MakePayment.jsx`: Main UI logic.
- `frontend/src/pages/student/MakePayment.css`: Styling.
- `frontend/src/pages/student/PaymentReceipt.jsx`: Receipt logic.
- `frontend/src/pages/student/PaymentReceipt.css`: Receipt styling.
- `frontend/src/pages/student/PaymentHistory.jsx`: History display.

### New Directories:
- `backend/uploads/payments/`: Stores uploaded proof documents.

---

## 5. Testing Instructions

1. **Login** as a student (e.g., `student2`).
2. Navigate to **Make Payment**.
3. Select **Bank Transfer**.
4. Enter a dummy **Reference Number** (e.g., `REF-999`).
5. Upload a dummy **PDF or Image**.
6. Click **Submit**.
7. **Verify**:
   - Redirect to Receipt page.
   - Header says **"Payment Under Review"** (Yellow).
   - Go to **Dashboard**: Outstanding Balance should **remain unchanged** (or verify via History that it didn't drop).
   - Go to **Transaction History**: New entry shows "Bank Transfer" and "Pending".

---

## 6. Future Considerations (Admin Side)
The current implementation handles the **Submission** side. The **Review** side will require:
1. Admin Dashboard to list 'PENDING' payments.
2. Capability to download/view the `proof_document`.
3. Actions to 'Approve' (reduce balance, change status to RECEIVED) or 'Reject' (notify student) the payment.
