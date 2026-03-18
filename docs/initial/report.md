---
summary: "Full project report covering architecture, system design, constraints, and trade-offs for MediTag"
read_when:
  - Designing or modifying system architecture
  - Understanding the SafetyEngine, AI Gateway, or data flow
  - Making decisions about design constraints or trade-offs
  - Implementing backend services, scanning workflow, or audit logging
title: "Project Report"
---

# MediTag

## Project Report

by

CMPE 195A

Binh Nguyen
Jonathan Nguyen
Gurshan Warya

**Project Advisor**

Wencen Wu

10/2025

---

## ABSTRACT

**Meditag**
By Binh Nguyen, Jonathan Nguyen, Gurshan Warya

Medical technologies become more developed, hence, the complexities of patient records, allergies and treatment plans also increase. Once these systems become more challenging, the hospital staff tend to make mistakes because they have to manage large amounts of patient and medication records under pressure. Therefore, healthcare professionals need a more reliable system to help them keep track of everything and prevent any potential harms that would occur.

Although hospitals already use tools such as barcoded wristbands, medication errors still occur for some reasons. These systems still mainly rely on manual verification by staff; as a result, there will be miscommunication which leads to incomplete access to patient histories. Errors such as giving the wrong medication, overlooking an allergy or misidentifying a patient can still happen. Even if these mistakes are rare, they still can cause serious consequences for patients and affect the hospital's credibility in the healthcare system. Currently, offered solutions are not good enough because they still depend on network connectivity which is limited to access in low-resource or offline hospital environments.

Overall, MediTag can potentially solve these problems by using an AI-assisted verification system that combines QR/NFC wristband scanning, local patient data storage and intelligent medication cross-checking. Moreover, MediTag can help nurses confirm patients' identity and verify medication through the mobile app. This mobile app operates securely on a local network. This system uses integrated Artificial Intelligence, which can provide contextual insights and real-time alerts for any potential risks such as drug interactions or dosage conflicts. MediTag aims to assure patient safety, improve clinical workflow efficiency and build a foundation for a more reliable, tech-assisted care industry.

---

## Table of Contents

- Chapter 1 - Project Overview
  - 1.1 Project Goals and Objectives
  - 1.2 Problem and Motivation
  - 1.3 Project Application and Impact
  - 1.4 Project Results and Deliverables
- Chapter 2 - Background and Related Work
  - 2.1 Background and Technologies
  - 2.2 State-of-the-art
- Chapter 3 - System Design
  - 3.1 Architecture Design
  - 3.2 Design Constraints, Problems, Trade-offs, and Solutions

---

## Chapter 1. Introduction

### 1.1 Project Goals and Objectives

The goal of the MediTag project is to create a system that improves patient safety by verifying medication and patient identity using modern technology. MediTag connects nurses, patients, and hospital data through the local network so their data stays safe. Each patient has a wristband with a QR and NFC code that links directly to their record in the hospital database. When scanned, the app checks the information in real time and alerts staff if anything does not match.

The main objective is to reduce medication errors and make the process faster and more reliable. Meditag runs completely on the hospital's local network to protect privacy and work without internet access. The system uses a mobile app built in React Native, a Node and Express server for processing, and a PostgreSQL database for storing patient data. It also includes a simple AI assistant that helps explain or detect possible safety issues. Together these features aim to make healthcare safer and easier to use.

### 1.2 Problem and Motivation

Medication mistakes are one of the most common problems in hospitals. These errors can happen when a nurse gives the wrong drug or dose to a patient, or just has the wrong patient. Many hospitals still rely on manual records which makes it hard to track. Even with electronic health records there's no easy way to confirm information at the bedside.

MediTag was created to solve this issue. The system gives nurses a quick way to scan and verify every step before giving medication. It combines local data, safety rules, and AI support to catch potential errors early. Because everything runs on a private local network, patient information stays safe and secure. The motivation for this project comes from wanting to build a system that supports medical workers, saves time, and prevents harmful mistakes.

### 1.3 Project Application and Impact

MediTag can be used in hospitals and clinics to make medication administration more accurate. The system creates a record of every scan which helps with auditing and training. MediTag demonstrates how software engineering, healthcare safety, and AI can come together to serve the general public. For hospitals, it offers a low-cost solution that runs on open-source tools and doesn't require a cloud connection. MediTag also improves patient trust and safety, especially in smaller or lower-resource medical facilities.

### 1.4 Project Results and Deliverables

The final MediTag system includes a working prototype with a mobile app for scanning wristbands, a web app for administrators, and a local server that manages data and verification. The deliverables include the working system, documentation, and demonstration materials like an installation guide, a presentation, and a demo video. The project code and final report will be submitted together.

---

## Chapter 2. Background and Related Work

### 2.1 Background and Technologies

Medication and clinical errors are one of the leading causes of preventable accidents in healthcare. Despite widespread adoption of electronic health records (EHRs), the lack of real time verification and integration between patient bedside systems continues to expose patients to risks like misidentification and incorrect drug administration. MediTag aims to address this problem by creating an interoperable verification system that combines modern software principles with healthcare safety standards.

MediTag's architecture is a modular and multi-tiered design that separates the mobile client, backend server, and database layers. This structure supports maintainability and scalability while supporting consistent updates across all different components of the architecture. Our aim is for the system to operate entirely within a hospital's local network to ensure that patient data remains on-premise and that all transactions remain private and compliant with hospital regulatory expectations.

The project uses a combination of several open-source technologies. The mobile application will be built in React native, and the interface will enable nurses to scan patient wristbands through NFC or QR code interfaces. The backend server will be developed using node.js to handle authentication, verification logic, and communication with the PostgreSQL database that stores patient records, logs, and all other data.

MediTag also has an AI integration to assist with medication safety checks and decision support. The model operates entirely on local hardware to provide clinical workers with feedback without compromising patient data and privacy. Asynchronous programming allows that all components of our project remain responsive, ensuring that verification and decision support at the bedside occurs real-time without blocking other services.

Apart from its technical implementation, MediTag is designed with security, transparency, and accountability in mind. Each scan is authenticated through verified IDs for staff and timestamped to maintain an audit trail. Data transmission is encrypted using modern protocols such as TLS 1.3, and all sensitive data will be encrypted using AES-256 encryption. This ensures MediTag aligns with best practices for handling healthcare data management and existing in real-world clinical settings.

### 2.2 State-of-the-art

There have been many advances in healthcare technology in recent years towards clinical decision support, interoperability, and AI-assisted tools, which all play into MediTag's design. Modern healthcare systems are more likely to depend on open standards such as SMART on FHIR and CDS Hooks, which allow external applications to connect securely with EHRs and provide decision support directly within clinical workflows. Studies such as Morgan et al. (2022) have shown that integration contextual alerts into healthcare workflows improves adoption rates, and reinforces the need for decision support systems embedded into existing hospital systems.

The integration of artificial intelligence into healthcare workflows has opened new possibilities for decision support but also introduced new challenges. Elhaddad and Hamam (2024) highlight that while AI can enhance efficiency and accuracy, it must be interpretable and grounded in clinical evidence. Similarly, research by Jung et al. (2024) and Vrdoljak et al. (2025) emphasizes that domain-specific AI models outperform general-purpose language models in clinical reasoning tasks and that bias and data quality remain significant concerns. MediTag addresses these findings by embedding AI within a controlled, human-in-the-loop framework. Its reasoning is limited to structured medical vocabularies such as RxNorm and SNOMED CT, ensuring that all generated insights are explainable and clinically verifiable.

Finally, transparency and safety are central to current engineering practices in healthcare software. Emerging guidelines and benchmarks, such as the Clinical Safety-Effectiveness Dual-Track Benchmark (CSEDB) introduced by Wang et al. (2025), call for medical AI systems to handle uncertainty cautiously and log all decision-making events for traceability. MediTag's approach aligns closely with these principles. When AI confidence is low, the system automatically defers to human judgment and records the event for later review. This design not only reduces risk but also promotes trust in AI-assisted clinical tools.

---

## Chapter 3. System Design

### 3.1 Architecture Design

MediTag is designed as a secure, local-first patient verification system that operates entirely within a hospital's private network. The architecture follows a tiered model consisting of client applications, backend services, and on-premise infrastructure that safely stores and processes patient information. All components communicate using encrypted channels (TLS 1.3) to ensure privacy, reliability, and compliance with healthcare data standards.

#### 3.1.1 Architecture Overview

The MediTag system is organized into three logical layers:

**1. Client Layer**

This layer includes all user-facing interfaces:

- **Nurse Mobile App (React Native):** Used during bedside verification to scan QR/NFC wristbands and room codes. The app displays patient identity, allergy warnings, active medications, and safety alerts. All communication with the backend occurs via HTTPS over the hospital LAN.
- **Admin Web Portal (React Web App):** Used by administrators to review logs, manage staff accounts, assign wristbands, and monitor system activity. It also communicates with the backend using encrypted HTTPS.

**2. Application Layer (Backend Services)**

Node.js/Express API Server are responsible for orchestrating most system functions:

- Handling authentication and role-based access control (RBAC)
- Parsing QR/NFC scan payloads
- Retrieving patient and medication records
- Running rule-based safety checks via the SafetyEngine
- Communicating with the AI Gateway for clinical explanations
- Creating audit logs for every event

**SafetyEngine**

Implements deterministic clinical validation logic such as:

- Allergy conflict detection
- Medication mismatch checking
- Dosage and frequency rule evaluation

The SafetyEngine is the authoritative layer for all safety checks. AI is used only for explanations, not decision-making.

**AI Gateway**

Provides optional AI-augmented reasoning through:

- Local on-prem LLM models for private, offline inference
- Optional cloud fallback to OpenAI/Anthropic in academic demo mode

All AI responses are structured, logged, and restricted to non-diagnostic explanations.

**3. Data & Intelligence Layer (On-Prem Infrastructure)**

All data storage and inference services run entirely on the hospital's secure LAN:

- **PostgreSQL Database (Encrypted at Rest):** Stores patient demographics, allergies, medications, wristband mappings, nurse accounts, and audit logs. UUID primary keys ensure global consistency across devices.
- **Audit Log Service:** Records every scan, decision, and AI explanation with timestamps, user IDs, room IDs, and risk levels. These logs support compliance, safety reviews, and analytics.
- **Local Model / Retrieval-Augmented Generation (Optional):** Hosts CPU-optimized AI models for explanations without needing internet connectivity or exposing PHI externally.

#### 3.1.2 Workflow and Data Flow

The system's operational workflow is best illustrated by the Patient Verification sequence diagram:

1. **Scan Initiation:** The nurse scans a patient wristband (QR or NFC) using the mobile app.
2. **Payload Submission:** The app sends a signed request to the API server containing scan metadata, device ID, user token, and the wristband UID.
3. **Record Retrieval:** The API retrieves the patient's identity, allergies, and active medications from PostgreSQL.
4. **Rule-based Verification:** The SafetyEngine evaluates clinical rules and determines whether the scan is safe, mismatched, or risky.
5. **AI Support (Conditional):** If a risk is detected, the API invokes the AI Gateway to generate a short, structured explanation visible to the nurse.
6. **Response & Display:** Scan results, including identity verification, risk alerts, and explanations, are returned to the mobile app.
7. **Audit Logging:** The entire interaction is recorded in the SCAN_LOG table.

#### 3.1.3 Class Model Representation

The UML class diagram captures the core domain entities:

- **Nurse** authenticates into the system and initiates scan sessions
- **ScanSession** represents each verification event linking Nurse -> Patient -> Room
- **Patient** contains demographics, allergies, and active medications
- **Wristband** maps to the patient's encoded QR/NFC identifiers
- **Medication** entries allow the SafetyEngine to check for conflicts
- **SafetyEngine** and **AIGateway** implement clinical logic and reasoning support

#### 3.1.4 Database Schema and Relationships

The Entity-Relationship Diagram (ERD) defines a normalized relational structure:

- PATIENT has many MEDICATION and WRISTBAND records
- NURSE generates SCAN_LOG entries
- SCAN_LOG references PATIENT, NURSE, and WRISTBAND to ensure every action is fully traceable
- All relations use foreign keys to enforce referential integrity

#### 3.1.5 Hardware & Network Architecture

The hardware block diagram shows physical components and their interactions:

- **Mobile Device:** Equipped with QR camera and NFC reader for contact and contactless wristband scanning
- **Clinical Environment:** Contains patient wristbands (QR + NFC) and room QR codes
- **Network Layer:** All communication routes through HTTPS/TLS over LAN, ensuring low latency and local-only data flow
- **Local Server:** Runs the Node.js API, PostgreSQL encrypted DB, AI Gateway, and Audit Log Service

---

### 3.2 Design Constraints, Problems, Trade-offs, and Solutions

#### 3.2.1 Design Constraints and Challenges

Designing MediTag requires navigating different economical, technical, environmental, and safety constraints to make sure the system can be deployed in real clinical environments. Many hospitals, especially those in smaller and public institutions, operate under limited budgets so the system can't depend on commercial cloud platforms, proprietary AI services, or expensive hardware. As a result, our design emphasizes open-source technologies like React Native, Node.js, Express, Docker, and PostgreSQL, all deployed on on-premise servers and standard mobile devices already in the hospital.

The system also faces resource constraints due to hardware limitations in hospital LAN environments. Because all components run locally the backend must process verification requests efficiently on CPU based servers without access to GPUs. The PostgreSQL database must remain encrypted while still supporting frequent read and write operations from both mobile and web clients. Audit logs must also be stored in a way that preserves their traceability without taking up too much disk space.

Environmental and workflow constraints also shaped our designs as nurses operate under time pressure where lighting, noise, and Wi-Fi coverage can vary widely. The interface needs to show clear alerts, load quickly, and minimize the steps required for each verification. The system must also remain usable in low resource medical settings where internet access might be unreliable or dedicated IT support isn't possible.

Hardware and software constraints also influenced MediTag's structure, as mobile devices must support rear cameras with autofocus for barcode scanning as well as NFC readers compatible with ISO/IEC 14443. Wristbands must follow ISO/IEC 18004 for QR encoding. The backend is restricted to a hospital controlled database, and all communication has to remain inside the LAN using TLS. Devices in the system are also assumed to be enrolled under mobile device management policies for trust and safety.

There are also significant safety and scientific constraints from the domain we're in. Medication verification depends on reliable mappings and standard vocabulary such as RxNorm for drug identifiers and SNOMED CT for allergies and conditions. Rule-based checks need to be deterministic and testable, and AI generated explanations can't have hallucinated information and must be grounded in real clinical data. The system needs to minimize false negatives as well which could lead to unsafe medications being administered.

#### 3.2.2 Design Solutions and Trade-offs

MediTag uses several design strategies to address these constraints, which each involve their own trade-offs between performance, safety, and cost. To meet privacy and offline requirements, the system uses a local-first approach where the backend, database, and AI Gateway all run on on-premise servers. This removes the dependence on the cloud and protects patient data from exposure, though it requires hospitals to have their own hardware and backups.

A modular architecture separates the React Native mobile app, the Node.js API server, the SafetyEngine, the AI Gateway, and the PostgreSQL database into separate components. This improves our maintainability and lets each layer update independently but introduces more deployment complexity and the need for consistent versioning.

For medication verification MediTag uses deterministic rule-based checks with optional AI explanation to ensure clinical decisions rely on logic that's transparent while still providing explanations where needed. However, running AI models locally means they must be smaller and less capable than cutting-edge cloud models, which might limit their ability to handle complex reasoning tasks, so the system relies on human judgement in certain cases.

To improve scanning reliability, patient wristbands store identifiers in both QR and NFC formats. QR scanning supports distance and visibility while NFC works in low light or in other situations where QR codes are damaged. Supporting both introduces more complexity but improves our robustness.

Since hospital Wi-Fi conditions can fluctuate the app includes mechanisms for retrying failed requests and caching noncritical data. This improves our reliability but requires careful design to make sure the cached information isn't used for final medication decisions.

Security is addressed through TLS encryption, AES based database encryption, RBAC access control, and restrictions on which devices can access the system. These provide strong patient data protection while also adding user friction during enrollment.

The system also logs every verification event for auditing and safety review. To prevent excessive storage usage, log rotation and archival strategies are used to preserve the traceability while keeping resources manageable. In practice this means very old logs may need to be accessed from archives instead of a primary database.

---

## References

1. E. G. Poon, C. A. Keohane, E. M. Featherstone, J. B. Hays, D. A. Dervan, R. L. Fraley, T. Karson, R. A. Shulman, and D. W. Bates, "Effect of bar code technology on the safety of medication administration," _New England Journal of Medicine_, vol. 362, no. 18, pp. 1698-1707, May 2010, doi: 10.1056/NEJMsa0907115.

2. A. Mulac, L. Mathiesen, K. Taxis, and A. G. Granas, "Barcode medication administration technology use in hospital practice: A mixed methods observational study of policy deviations," _BMJ Quality and Safety_, vol. 30, no. 12, pp. 1021-1030, Dec. 2021, doi: 10.1136/bmjqs-2021-013223.

3. K. Grailey, R. Hussain, E. Wylleman, A. Ezzat, S. Huf, and B. D. Franklin, "Understanding the facilitators and barriers to barcode medication administration by nursing staff using behavioural science frameworks: A mixed methods study," _BMC Nursing_, vol. 22, article 378, 2023, doi: 10.1186/s12912-023-01382-x.

4. K. L. Morgan, B. L. Lenert, B. S. Dixon, A. W. Wright, and D. F. Lobach, "Using CDS Hooks to increase SMART on FHIR app utilization: A cluster randomized trial," _Journal of the American Medical Informatics Association_, vol. 29, no. 9, pp. 1461-1470, Sept. 2022, doi: 10.1093/jamia/ocac085.

5. SMART Health IT, "SMART on FHIR," Boston, MA, USA. Accessed Nov. 29, 2025.

6. U. S. National Library of Medicine, "RxNorm," Bethesda, MD, USA. Accessed Nov. 29, 2025.

7. U. S. National Library of Medicine, "SNOMED CT," Bethesda, MD, USA. Accessed Nov. 29, 2025.

8. Q. Xu, J. Wu, and G. Gao, "Interpretability of clinical decision support systems based on artificial intelligence from technological and medical perspective: A systematic review," _Journal of Healthcare Engineering_, vol. 2023, article 9919269, Feb. 2023, doi: 10.1155/2023/9919269.

9. S. Labkoff et al., "Toward a responsible future: Recommendations for AI enabled clinical decision support," _Journal of the American Medical Informatics Association_, vol. 31, no. 11, pp. 2730-2739, Nov. 2024, doi: 10.1093/jamia/ocae209.

10. S. Wang et al., "A novel evaluation benchmark for medical LLMs: Illuminating safety and effectiveness in clinical domains," arXiv:2507.23486, July 2025.

11. M. Elhaddad and S. Hamam, "AI driven clinical decision support systems: An ongoing pursuit of potential," _Cureus_, vol. 16, no. 4, e57728, Apr. 2024, doi: 10.7759/cureus.57728.
