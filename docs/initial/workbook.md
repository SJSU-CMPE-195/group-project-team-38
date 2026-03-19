---
summary: "Comprehensive project workbook with literature review, requirements, dependencies, architecture, broader impact, and design details"
read_when:
  - Looking up project requirements (functional and non-functional)
  - Understanding use cases, assumptions, or constraints
  - Reviewing literature and state-of-the-art for clinical decision support
  - Checking dependencies like NFC/QR hardware, database, or AI model access
  - Understanding broader impact (health, economic, social, environmental)
title: "Project Workbook"
---

# Meditag

## Project Workbook

By
Binh Nguyen
Gurshan Warya
Jonathan Nguyen

10/15/25

Advisor: Wencen Wu

---

The Project Workbook is used to collect research, proposal, requirements, architecture, design, implementation, and project planning information. This assignment is not intended to be used as a writing assignment but as a technical assignment that collects a verbose amount of information about your project. You will ultimately select a subset of the information from this workbook to include in your Project Report. The Project Report will require strict attention to the detail required for a writing assignment.

The information collected in this workbook includes a state-of-the-art description, literature search, project justification, requirements, architecture, design (including tradeoffs, UML artifacts, UI mockups, and database design), QA, performance validation planning, implementation planning, and project management planning (task assignment and schedule). This information is organized in nine chapters of this document. You can add additional chapters if you think your project has other information that needs to be collected.

Information in this document will be collected and evaluated across two assignments (referred to in this document as Workbook Part 1 and 2). The chapter descriptions below indicate which of the chapters are evaluated in each of the workbook assignments. You should continue to use this workbook as a collection point for information related to your project until your project is completed.

All members of your project team should contribute to this document. Each member of your project team should identify their individual contributions in this document.

---

## Chapter 1. Literature Search, State of the Art

### Literature Search

Clinical decision support systems (CDSS) are rapidly evolving with the integration of artificial intelligence and interoperability standards. To establish a foundation for MediTag's design, a comprehensive literature review was conducted across PubMed and IEEE Xplore databases using terms such as "clinical decision support systems," "SMART on FHIR," "CDS Hooks," "AI in healthcare," and "large language models (LLMs) in medicine." The most relevant publications provide insight into the current challenges, best practices, and research gaps within medication safety and AI-augmented decision support.

#### AI-Augmented Clinical Decision Support Systems

Elhaddad and Hamam (2024) provide an overview of how artificial intelligence has been incorporated into clinical decision support systems to improve patient outcomes and reduce clinician workload. Their review identifies persistent limitations, such as data quality, lack of interpretability, and integration barriers that hinder AI adoption in safety-critical workflows. They argue that future systems must emphasize explainable reasoning and real-time validation within the clinical context. This aligns directly with MediTag's goal of implementing transparent, evidence-based reasoning when verifying medication safety and patient identity.

#### Interoperability Through SMART on FHIR and CDS Hooks

Morgan et al. (2022) conducted a cluster-randomized trial testing how contextually relevant CDS Hooks notifications affect the use of SMART on FHIR applications in clinical settings. The study found that introducing workflow-integrated prompts increased app utilization by more than twofold. This demonstrates that embedding decision support directly within clinician workflows, rather than relying on separate applications actually improves usability and adoption. MediTag draws upon this evidence by adopting SMART on FHIR authentication and CDS Hooks triggers to seamlessly integrate its QR-based verification tool into existing EHR environments.

#### Bias and Transparency in Medical LLMs

Vrdoljak et al. (2025) review the rapid emergence of large language models across medical education, healthcare administration, and clinical decision support. They highlight both the transformative potential of LLMs in summarizing medical data and their associated risks, including bias, hallucination, and inconsistent reasoning. Their study underscores the need for auditability, bias mitigation, and model grounding in trusted data sources, which are principles that directly inform MediTag's design philosophy of implementing retrieval-augmented generation with structured clinical vocabularies such as RxNorm and SNOMED CT.

#### LLMs as Collaborative Assistants

Jung et al. (2024) empirically evaluate a specialized LLM, Ask Avo, against ChatGPT-4 in a controlled clinical decision-making scenario. They report that domain-specific models significantly outperformed general-purpose LLMs in trustworthiness, relevancy, and comprehensibility. The study concludes that AI systems designed for targeted clinical use yield more reliable support than general models. MediTag follows this principle by constraining its LLM-based medication reasoning module within a verified, domain-specific context and incorporating a "human-in-the-loop" design.

#### Safety and Performance Benchmarking for Medical LLMs

Wang et al. (2025) introduce the Clinical Safety-Effectiveness Dual-Track Benchmark (CSEDB) to evaluate LLM performance in real-world healthcare scenarios. The benchmark focuses on guideline adherence, medication safety, and domain accuracy across high-risk cases. Their findings reveal that while specialized models outperform general ones, performance significantly decreases in ambiguous or high-risk scenarios. This indicates the need for conservative system behavior and human oversight and directly supports MediTag's design choice to implement uncertainty-aware prompts and escalation pathways when the AI's confidence is low.

### State-of-the-Art Summary

This section covers some of the most current and leading approaches or techniques for MediTag's domain. This means clinical interoperability, medication safety at point of care, decision support with LLMs, and transparent design practices.

#### 1. Interoperability and Workflow Embedding

Modern clinical apps integrate SMART on FHIR and CDS Hooks standards. SMART on FHIR provides OAuth authentication workflows to enable apps to launch within Electronic Health Records (EHR) and access patient FHIR data without custom services and interfaces. CDS Hooks enables event-driven "hooks" in EHR workflows where external services can return suggestions or link to external apps. One study demonstrated that relevant CDS Hook prompts significantly increased usage of a SMART app (from 2.6% to 6.0% of interactions) (Morgan et al., 2022).

In summary, state-of-the-art systems aim to support numerous other software integrations at the EHR level, providing standards for existing tools and integrations.

#### 2. Point-of-Care and Medication Safety Checks

Medication errors are some of the highest risks in patient care. Traditional alert systems for drug-drug interactions and dosage limits exist, but still suffer from human faults like fatigue or lack of context. A big focus for this issue is combining bedside scanning for patient identification and live data-driven checks for medication administration.

Bar Code Medication Administration (BCMA) is gaining popularity in the healthcare industry, and its use has strong evidence of reducing errors involving wrong patients, wrong dosages, and medical administration errors. Contemporary studies have reported that BCMA adoption has led to a double-digit reduction in patient error rates. QR/GS1 barcodes and NFC can extend these gains to mobile form factors as well.

Modern bedside applications for clinical employees can also pair patient wristband scans with live EHR checks via FHIR as well, allowing for ease of verification.

#### 3. Decision Support

The FDA currently provides Clinical Decision Support (CDS) guidance to specify which software functions are outside device regulation. When it comes to AI-powered decision support, the U.S. Oncology Network (ONC) introduced the HTI-1 final rule, which adds certification and algorithm transparency requirements for Decision Support Interventions (DSIs), which provides insight into the origin of any logic, data, performance, and bias characteristics that AI-aided guidance systems may produce.

#### 4. LLM-Augmented Clinical Support

Recent peer-reviewed articles showcase the use of LLMs as an assistive layer wrapped by guardrails. They are used for summarization, medicine-to-medicine interaction explanations, and patient-friendly instructions. One study compared pure LLM CDSS vs a "co-pilot" mode (LLM assisting a junior pharmacist) in identifying drug-related problems across 61 prescribing error cases. The co-pilot mode achieved higher accuracy than LLMs alone (Jung et al., 2024). The authors argued that combining human and LLM reasoning yields safer, more accurate results.

Retrieval-Augmented prompts with context from RxNorm (a tool that normalized names for clinical drugs and links its names to other drug vocabularies), SNOMED (Systematized Nomenclature of Medicine - Clinical Terms, a comprehensive standard for clinical terminology), and FHIR facts can produce structured information without uncertain/biased logic. However, active research highlights bias risk, such as under-recognizing symptoms in women and minorities, since the data is trained from real-world cases. This reinforces the need for bias auditing, diverse data, and human intervention in training workflows.

In sum, LLMs should not be used as autonomous agents in the healthcare field, but rather as assistants with guardrails.

#### 5. Safe and Transparent Engineering Practices

Since MediTag operates in the medication safety domain, any decision support must adhere to emerging safety, audit, and transparency expectations. In the medical engineering world, modern systems in regulated spaces adopt IEC 62304 (software life cycle), ISO 14971 (risk management), and audit trails, along with logging of overrides and continuous monitoring.

To mitigate AI risks, designs include uncertainty-aware UIs (deferring low model confidence to human judgment), human-in-the-loop review, and logging/feedback loops for model calibration.

Additionally, new research introduced a benchmark covering 30 criteria to evaluate LLMs in clinical settings. The results showed domain-specific models generally outperform general models, but performance degrades in higher-risk situations (Wang et al., 2025).

In conclusion, the state of the art in MediTag's domain is defined by modular integration with existing EHR systems via interoperability standards, bedside scanning and data validation, and LLM-assisted clinical reasoning within constrained and auditable workflows.

### References

1. Elhaddad, M., & Hamam, S. (2024). AI-Driven Clinical Decision Support Systems: An Ongoing Pursuit of Potential. _Cureus_, 16(4), e57728. https://doi.org/10.7759/cureus.57728

2. Jung, D., Butler, A., Park, J., & Saperstein, Y. (2024). Evaluating the impact of a specialized large language model on physician experience in clinical decision support: A comparison of Ask Avo and ChatGPT-4. arXiv preprint arXiv:2409.15326. https://doi.org/10.48550/arXiv.2409.15326

3. Morgan, K. L., Kukhareva, P. V., Warner, P. B., Wilko, J., Snyder, M., Horton, D., Madsen, T., Habboushe, J., & Kawamoto, K. (2022). Using CDS Hooks to increase SMART on FHIR app utilization: A cluster-randomized trial. _Journal of the American Medical Informatics Association_, 29(9), 1461-1470. https://doi.org/10.1093/jamia/ocac085

4. Vrdoljak, J., Boban, Z., Vilovic, M., Kumric, M., & Bozic, J. (2025). A review of large language models in medical education, clinical decision support, and healthcare administration. _Healthcare_, 13(6), 603. https://doi.org/10.3390/healthcare13060603

5. Wang, S., Tang, Z., Gong, Q., Gu, T., Ma, H., Wang, Y., Niu, Z., Wang, P., Liu, L., Zhang, H., Shen, H., Zhao, Q., & Wu, J. (2025). A novel evaluation benchmark for medical LLMs: Illuminating safety and effectiveness in clinical domains. arXiv preprint arXiv:2507.23486. https://doi.org/10.48550/arXiv.2507.23486

---

## Chapter 2. Project Requirements

### Essential Features

Each patient wristband encodes a unique identifier in both QR and NFC formats, linking scans directly to the patient's local record. The React Native app lets nurses verify identity and review key data such as allergies, medications, and recent logs. The system performs rule-based and AI-assisted checks to detect mismatches or allergy conflicts before administration. All data is stored on a local PostgreSQL server with no external dependencies. Every scan and update is authenticated, timestamped, and tied to a verified staff ID for full auditability.

### Desired Features

An embedded AI assistant powered by a local model (with optional external LLM support) provides clinical explanations and medication guidance. The app supports offline caching and synchronization when reconnected to the LAN. The admin dashboard displays scan analytics, alerts, and system health metrics. A wristband assignment workflow links admissions directly to printed IDs, reducing manual errors. Administrators can export daily reports in CSV or PDF formats summarizing verified administrations and flagged mismatches.

### Non-Functional Requirements

| Category        | Specification                                                                     |
| --------------- | --------------------------------------------------------------------------------- |
| Performance     | Patient verification completes in ≤ 2 seconds on typical hardware.                |
| Reliability     | ≥ 99% scan success rate on valid wristbands under normal lighting.                |
| Availability    | Local server uptime ≥ 99.5% within LAN deployment.                                |
| Security        | AES-256 encryption for data at rest; TLS 1.3 for LAN communication.               |
| Privacy         | Only de-identified or simulated data used in academic environments; PHI excluded. |
| Usability       | First-time nurse users complete a scan within 5 minutes of introduction.          |
| Maintainability | Modular architecture separating UI, API, and database layers for ease of update.  |
| Scalability     | Supports ≥ 100 concurrent scan events per minute in a typical hospital ward.      |

### Use Case View

- **Actor:** Nurse
- **Goal:** Verify patient identity before medication administration.
- **Scenario:** Nurse launches app → scans QR/NFC → patient profile loads → system cross-checks medications → AI alerts if risk detected → nurse confirms administration.
- **Success Outcome:** Correct patient verified and log entry stored.
- **Failure Condition:** Mismatch detected → alert displayed and override requires admin confirmation.

### Assumptions

- Each patient receives a unique encoded wristband at admission.
- Hospital devices share a secure local network and time source.
- Staff complete HIPAA and device use training before deployment.

### Constraints

- The application runs on React Native 0.76 (Android 13+, iOS 16+) and modern desktop browsers.
- Database limited to on-prem Postgres cluster (no cloud services).
- Wristband printers and scanners must support ISO/IEC 18004 (QR) and 14443 (NFC).

---

## Chapter 3. Dependencies and Deliverables

### Dependencies

#### NFC and QR Hardware

Every mobile device used within the system must have the capability to both read and write NFC tags, as well as a rear camera equipped with autofocus for scanning QR codes. This ensures that wristbands and printed identifiers can be read quickly and accurately in various lighting or motion conditions. The wristbands and printed QR labels themselves must conform to international standards, such as ISO/IEC 18004 for QR codes and ISO/IEC 14443 for NFC communication. Compliance with these standards guarantees durability and reliable scanning across all supported devices.

#### Local Database and Server Availability

The backbone of the system is its on-premise PostgreSQL database, which must remain consistently active and accessible. Because all patient data and system configurations are stored locally, any interruption in the database service will immediately halt the application's functionality. Hospitals should ensure the database server is equipped with redundant power, storage protection, and regular snapshot backups to maintain both data integrity and service uptime.

#### Network Configuration

The hospital's local area network (LAN) must allow secure, low-latency communication between the mobile and desktop applications. This requires properly configured internal routing and firewall rules that permit access to the internal API endpoints and database ports while maintaining isolation from public internet traffic. Network administrators should ensure that the system operates only over encrypted channels (such as HTTPS and SSL-enabled PostgreSQL connections) to prevent data interception.

#### Device Authorization

To maintain security and compliance, every mobile device that connects to the system must be enrolled under the hospital's mobile device management platform. This enrollment process ensures that only verified, policy-compliant devices can access patient information and use the scanning features. If a device fails to register or loses its authorization status, it will be blocked from system access to protect sensitive data.

#### AI Model Access

For advanced safety verification, the system integrates with local AI models hosted on the hospital's on-premise server. These models assist in analyzing scanned data for potential anomalies or inconsistencies in patient information. Because they are deployed locally, they eliminate dependency on external internet connectivity and third-party APIs, improving both privacy and reliability. If the local AI service becomes unavailable, the system continues to operate normally, performing all core scanning and verification functions without interruption, although AI-assisted safety checks will remain offline until the service is restored.

### Deliverables

The prototype includes a React Native mobile app for scanning NFC and QR codes to verify patients, a React web portal for administrators to review logs and reports, and a local PostgreSQL server providing RESTful APIs for data synchronization. Hosting the backend locally ensures privacy, fast response times, and reliable performance even without internet access.

Supporting documents include an installation and configuration manual, a user guide for nurses and administrators, and system architecture diagrams outlining how data flows between the mobile app, web portal, and local server.

Deliverables include a final slide deck, a demo video, and a poster display summarizing system features. The presentation highlights the integration of local AI models for safety checks and the system's human-in-the-loop design for improved reliability.

---

## Chapter 4. Project Architecture

### Architecture Description

#### System Overview

MediTag uses a local-first, tiered client-server architecture. All components run within a hospital's local network to ensure privacy, low latency, and reliability. The architecture separates the user interfaces (mobile and web) from backend logic and databases to maintain modularity and facilitate updates.

#### Workflow Summary

A nurse scans a patient wristband or room QR code using the React Native app. The scan data is sent via HTTPS to the on-premise API, which authenticates the request, retrieves data from PostgreSQL, and performs safety checks. The AI Gateway uses a local model (or optionally an external LLM) to explain or validate alerts. Results are logged immutably and returned to the app, while the admin dashboard accesses the same API for logs and reports.

#### Subsystems

The system includes a React Native mobile app for QR/NFC scanning, a Node/Express API for data and logs, a PostgreSQL database encrypted at rest, and a React web portal for administration. A local AI Gateway handles de-identified inference, and an optional FHIR adapter supports interoperability with hospital systems.

#### Architectural Rationale

All data and traffic stay within the local LAN for security. The system remains functional offline for reliability. Its modular structure supports easy updates for maintainability, can scale across wards for scalability, and follows modern layered architecture aligned with IEEE 830 standards.

---

## Chapter 5. Broader Impact

### Public Health and Safety Impact

MediTag enhances patient safety by reducing one of the most significant risks in the healthcare system - medication administration errors. Scanning and verifying medications before administration can ensure a safety loop and minimize incidents including wrong patients, wrong dose or wrong medication. In the long term, these practices can improve trust in clinical automation and reduce preventable adverse drug events in hospitals.

### Welfare Impact

Standardizing patient identification and medication verification processes regardless of patient language, literacy or demographic background can help promote equitable care for all patients. The simple process of scanning and confirmation can support a diverse nursing workforce and can be easily adopted in various care environments.

### Global Impact

Low-resource healthcare systems often lack access to integrated EHRs or AI-supported tools. So MediTag's on-premises, low-bandwidth design allows deployment in hospitals without reliable internet connectivity. Its modular, standards-based approach (FHIR/SMART interfaces) can also support adaptation to different regulatory contexts, infrastructures, and languages, supporting global scalability and interoperability.

### Economic Impact

Medication errors can cause enormous economic losses through wasted drugs, prolonged hospital stays, and potential litigation. MediTag's early warning verification can reduce these risks significantly. Also, the system operates mainly on open-source frameworks (React, Node.js, PostgreSQL) which can minimize licensing and maintenance costs. The optional AI integration provides scalable intelligence without requiring full-time expert oversight, which can be cost-effective for small and mid-sized hospitals.

### Social Impact

MediTag can transform hospital workflows by reducing manual verification tasks and decreasing cognitive load on nurses, allowing them to have more time to focus on patient interaction, thus strengthening accountability and reinforcing a culture of safety rather than blame. MediTag can also serve as a training aid to help students understand safe medication practices and digital record management.

### Environmental Impact

MediTag indirectly reduces waste by minimizing the need for re-printed forms, duplicate medication labels, and paper logs. Using QR/NFC wristbands instead of disposable printed barcodes can reduce paper and toner consumption over time. Running all services on-premises can reduce data center emissions associated with cloud computing.

---

## Chapter 6. Project Design

MediTag is designed as a local-first patient safety verification system that uses QR and NFC wristband scanning to validate patient identity, cross-check medication safety, and assist clinical staff through rule-based and AI-augmented decision support. These design artifacts will cover UML diagrams, sequence diagrams, UI mockups, database entity diagrams, and hardware block diagrams.

### UML Class Diagram

_Figure 6.1: UML Class Diagram representing the core system entities and logic._

As illustrated in Figure 6.1, our systems logic is divided into different entities to separate concerns. The Nurse class handles authentication and role verification. The core functionality revolves around the ScanSession which captures the interaction between a Nurse, a Patient, and a specific Room. The SafetyEngine interfaces with the Patient record to check for activeMeds and allergies, and if a complex medical scenario comes up the AIGateway is called to provide explanation through runLocalModel or runLLMFallback.

### UML Sequence Diagram

_Figure 6.2: Sequence Diagram illustrating the "Patient Verification" workflow_

Figure 6.2 shows the data flow during a standard scan, starting with the Nurse initiating the scan via MobileApp. To start, the app submits the scan payload (via QR or NFC data) to the API. Then, the API queries our PostgreSQL database to fetch the patient's identity and active medication profile. Then the SafetyEngine processes this data against rule-based logic and if a risk is detected the system requests an explanation from the AIGateway. This results in the final verification alert being returned to the MobileApp to display it.

### Database Entity Diagram

_Figure 6.3: Entity Relationship Diagram (ERD) showing the relational schema._

The database schema shown in Figure 6.3 uses UUIDs for all primary keys so theres unique identification across all systems. The main entity is the PATIENT table which holds the demographic data and dynamic fields like allergies. Relationships are forced strictly, where for example the SCAN_LOG table references the NURSE, PATIENT, and WRISTBAND tables. This allows us to trace back every scan to a specific actor and patient which satisfies our audibility requirement. The MEDICATION table has a one-to-many relationship with the patient which allows the safety engine to query current prescriptions against potential allergens.

### Hardware Block Diagram

_Figure 6.4: Hardware Block Diagram detailing physical components and network interfaces._

Figure 6.4 shows our physical architecture, where MobileDevice is our primary input node and utilizes the built-in QR Camera Scanner and NFC Reader to capture data from the ClinicalEnvironment (Patient wristbands and room qr codes). This device communicates via HTTPS TLS over the local LAN. The LocalServer acts as the central hub and hosts the nodejs API, the database, and the AI gateway. This physical separation allows our heavy processing to occur on the server which preserves the battery life and performance of the mobile units.

### UI Mockups

#### Mobile

This figure shows our mobile interface is designed to reduce cognitive load during high-stress clinical shifts. The "Patient Verification" screen has immediate access to identity details and uses color-coded tags to highlight flags like allergies, fall risks, or diabetic status. The "Allergy Conflict" screen uses high-contrast red warnings.

#### Desktop

_(See original PDF for desktop mockup screenshots)_

### Tools Required

| Tool                          | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| React Native                  | Mobile app development for QR/NFC scanning |
| Expo/CLI + Native Modules     | Access to camera, NFC hardware             |
| Node.js + Express             | Backend API layer                          |
| PostgreSQL                    | Encrypted data storage on-prem             |
| Docker Compose                | Deploy DB + API locally                    |
| NFC Tools + Wristband Printer | Hardware testing                           |
| MermaidJS                     | Diagramming for UML, ERD, block diagrams   |
| Figma                         | UI mockups and screen flow design          |
| Jest + Postman                | Testing APIs and verification logic        |

### Tools to Learn

| Tool                  | Gaps                                      | Learning Plan                                                                             |
| --------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| NFC React Native APIs | Team has no prior NFC experience          | Use react-native-nfc-manager docs and build a test app to interface with NFC tags         |
| Docker for deployment | Some familiarity but not production ready | Complete official Docker tutorial plus run local Postgres in containers                   |
| Local LLM hosting     | Limited experience                        | Start with smaller models (Mistral, Llama) and run on CPU and study Ollama/OpenLLM basics |
| Figma                 | Not all team members have experience with | Assign one member to create primary screens and teach others basic frame editing          |

### Alternative Design Choice

When building MediTag, we were comparing two options: running everything on the hospital's local network, or hosting the system in the cloud. We chose the local-first design because it fits the needs of the hospital better as all the patient information stays inside the building, keeping it safer and avoiding problems with privacy rules. The system also works even when the internet goes down as it doesn't rely on external servers. Since everything runs on the hospital's local network, the app responds faster and nurses can complete scans without delays. It also makes it easier for the hospital to keep full control over logs and access to the information.

The downside of this design is that it requires the hospital to maintain its own equipment as servers need to be updated, monitored, and backed up. Hospitals already handle similar systems though, so this isn't a major change. The benefit of reliability and patient data staying onsite makes this option the safer and more dependable choice for our project.

The cloud-hosted option would also reduce the amount of hardware the hospital needs to manage since we'd be fully responsible for handling that, but this creates new problems as patient information would have to travel over the internet, increasing privacy risk. If the hospital internet goes down or is slow, the app would stop working during patient care. For a system that prevents medication errors, these risks are too high for us to use a cloud-hosted option, so we decided on local-first design.

---

## Chapter 7. Project Schedule

### Final Project Schedule

MediTag Senior Project Schedule

### Communication and Collaboration

To ensure efficient knowledge sharing and decision making for our team, we will integrate an Agile-hybrid style approach for our workflow. We will utilize Discord for daily asynchronous check-ins, where team members post their progress and next steps. For more formal planning and team alignment, we will have weekly meetings on Discord every Monday at 6:00 PM to review the previous week's progress, assign ownership for upcoming tasks, and address any blockers. Additionally, all code changes will be subject to a thorough code review on GitHub, requiring approval from both other team members before merging. We will use this collaboration approach in tandem with our project schedule, ensuring we are not falling behind.
