# INNOVATHON 2026 — Master Pitch & Judges Defense Dossier
## Project: TrustLens (Criminal Network Intelligence System)

---

## 1. Executive Summary for Presentation & Judges Round

### 1.1 The 30-Second Elevator Pitch
> *"Judges, in 2023, India registered over 5.3 million FIRs. When complex financial cyber-fraud, digital arrest syndicates, or organized crime networks strike, investigators spend weeks manually cross-referencing telecom CDRs, UPI dumps, vehicle registrations, and police complaints in disconnected Excel spreadsheets. 
> 
> **TrustLens** is an explainable, forensic-grade Criminal Network Intelligence platform that ingests multi-modal data streams, resolves suspect identities with explicit **REFUSAL** safeguards against wrongful arrests, maps the syndicate hierarchy through 7 mathematical heuristics and a **Color Psychology Threat Spectrum**, and secures the entire evidentiary chain with an append-only cryptographic SHA-256 custody ledger ready for trial under Section 65B of the Indian Evidence Act."*

---

### 1.2 Core Pillars & What Makes TrustLens Win

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TRUSTLENS CORE ARCHITECTURE                           │
├─────────────────────┬──────────────────────┬────────────────────────────────────┤
│ INGESTION & PARSING │ ENTITY RESOLUTION    │ GRAPH & SCORING ENGINE             │
│ • Universal CSV/TSV │ • Hard Discriminator │ • Person-to-Person Graph Projection│
│ • CDRs, Bank Dumps, │   Engine             │ • 7 Named Deterministic Heuristics │
│   VAHAN & FIRs      │ • "REFUSE" Cards     │ • Color Psychology Threat Spectrum │
│ • Auto-Normalization│ • Transliteration &  │ • Interactive Temporal Slider      │
│   & Indian Schemas  │   Alias Linking      │ • IMEI & Money-Path Pivots         │
├─────────────────────┴──────────────────────┴────────────────────────────────────┤
│                  LEGAL FORENSICS & INTEGRITY (SECTION 65B)                      │
│ • Append-Only SHA-256 Web Crypto Hash Chain (Tamper-Evident Ledger)            │
│ • Verbatim Evidence Extracts (Zero Hallucination Guarantee)                     │
│ • Court-Ready Dossier PDF Export with Cryptographic Hash Manifest              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

1. **Explicit Identity Refusal (The #1 Pitch Differentiator)**:
   - While existing AI tries to greedily merge every similar name, TrustLens is the first engine with dedicated **REFUSE Cards**. It checks hard discriminators (conflicting fathers' names, incompatible age brackets, conflicting cell towers) to prevent disastrous false-positive criminal merges (e.g., merging an innocent Indore schoolteacher with a syndicate coordinator).
2. **Person-to-Person Graph Projection**:
   - Rather than cluttering the canvas with cell towers and bank branches (which naive algorithms falsely label as "kingpins"), TrustLens collapses heterogeneous multi-hop interactions into a direct weighted Person-to-Person graph.
3. **Color Psychology Threat Spectrum**:
   - Threat levels (0–10) are mapped across 5 cognitive ergonomics tiers:
     - 🔴 **Critical (≥7.0)**: Crimson Red & radiant aura — Amygdala stimulation for immediate kingpin containment.
     - 🟠 **Elevated (5.0–6.9)**: Vivid Orange — High vigilance for active handlers and brokers without alarm fatigue.
     - 🟡 **Moderate (3.0–4.9)**: Golden Amber — Cautionary scrutiny for couriers and mule accounts.
     - 🔵 **Guarded (1.0–2.9)**: Cool Cyan — Analytical observation for peripheral associates.
     - 🟢 **Benign (<1.0)**: Emerald Green — Clear baseline for verified legitimate witnesses/noise.
4. **Explainable Heuristics, Not Black-Box AI**:
   - No opaque deep-learning hallucination. Every priority score is composed of 7 queryable, transparent mathematical graph metrics ($HUB$, $BROKER$, $COMMUNITY$, $BURST$, $FADEOUT$, $NEW\_CONNECTION$, $STAR$) that can be cross-examined on the witness stand.
5. **Cryptographic SHA-256 Evidence Chain-of-Custody**:
   - Uses Web Crypto SHA-256 hash chaining to guarantee data integrity. If an insider mutates a single historical byte, the chain breaks visibly and identifies the exact compromised block.

---

## 2. The 7 Forensic Graph Heuristic Models (Technical Deep-Dive)

TrustLens replaces uninterpretable "black-box" neural scores with **7 deterministic graph heuristics** rooted in empirical criminology and network science. Every heuristic produces a queryable boolean signal ($0$ or $1$) and an associated sub-score backed by verbatim case evidence.

### 2.1 Heuristic Summary Matrix

| # | Heuristic Key | Name | Weight | Mathematical Formulation | Criminological Target | Tactical Meaning |
|---|---|---|:---:|---|---|---|
| **1** | `HUB` | **Hub Detection** | **0.25** | $k_i > 2 \cdot \langle k \rangle$<br>*(Degree > 2× network mean)* | **Syndicate Coordinator / Call Center Operator** | Identifies individuals with anomalous direct contacts across victims, mules, and co-accused. |
| **2** | `BROKER` | **Broker Centrality** | **0.25** | $C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}} \in \text{Top } 10\%$ | **Syndicate Bridge / Hawala Operator** | Detects the critical bottleneck bridging disconnected clusters (e.g., procurement ring to money laundering pool). |
| **3** | `BURST` | **Burst Detection** | **0.15** | $V_{48\text{h}} > 3 \cdot \bar{V}_{7\text{d}}$<br>*(48h volume > 3× 7-day rolling mean)* | **Active Incident Coordination** | Detects intense spikes in telecom or banking traffic immediately prior to the execution of a crime. |
| **4** | `NEW_CONNECTION` | **New Connection** | **0.15** | $t_{\text{first}} \in [t_{\text{FIR}} - 30\text{d}, \, t_{\text{FIR}}]$<br>*(First seen < 30 days before FIR)* | **Recruited Accomplice / Fresh Mule** | Flags accounts or phone numbers brought into the syndicate just prior to the offense. |
| **5** | `STAR` | **Star Pattern** | **0.10** | $k_i \ge 5 \;\land\; C_i = \frac{2 e_i}{k_i(k_i - 1)} < 0.3$<br>*(Degree $\ge$ 5 & Clustering < 0.3)* | **Compartmentalized Kingpin** | Uncovers command-and-control structures where subordinates talk to the boss but are forbidden from talking to each other. |
| **6** | `FADEOUT` | **Fade-Out Detection** | **0.05** | $\Delta V_{14\text{d}} < -0.80 \cdot \bar{V}_{\text{baseline}}$<br>*(Volume drop > 80% pre-FIR)* | **Operational Blackout / SIM Burner** | Spots suspects who suddenly discard active SIM cards or cease comms days before the offense to evade tracking. |
| **7** | `COMMUNITY` | **Community Membership**| **0.05** | $\max_C Q = \frac{1}{2m}\sum_{ij}\left[A_{ij}-\frac{k_i k_j}{2m}\right]\delta(c_i,c_j) \land \|C\| \ge 3$ | **Organized Syndicate Cell** | Groups suspects into tightly coupled operational clusters using the Louvain modularity algorithm. |

---

### 2.2 Deep-Dive into Each Model

#### 1. Hub Detection (`HUB` — Weight: 0.25)
* **What it catches**: High-degree nodes maintaining abnormal connectivity.
* **Why it matters**: In financial fraud and cyber-extortion, call centers and coordinator handsets must route commands to multiple mule account holders simultaneously.
* **Math**:
  $$k_i = \sum_{j} A_{ij} \quad \text{Condition: } k_i > 2 \cdot \left( \frac{1}{N}\sum_{m=1}^{N} k_m \right)$$
* **Evidence Linked**: Call Detail Records (CDR call frequency), UPI transfer fan-out counts.

#### 2. Broker Betweenness Centrality (`BROKER` — Weight: 0.25)
* **What it catches**: Strategic intermediaries with low degree who control communication flow between separate sub-gangs.
* **Why it matters**: Kingpins rarely call ground agents. They speak through 1 or 2 "brokers" (cutouts). Degree centrality misses them, but betweenness centrality catches them instantly.
* **Math**:
  $$C_B(v) = \sum_{s \neq v \neq t} \frac{\sigma_{st}(v)}{\sigma_{st}}$$
  Where $\sigma_{st}$ is total shortest paths from node $s$ to $t$, and $\sigma_{st}(v)$ is paths passing through $v$. Nodes in the 90th percentile trigger this flag.

#### 3. Temporal Burst Detection (`BURST` — Weight: 0.15)
* **What it catches**: Sudden surge in communication volume or money velocity in the 48-hour window before an FIR or incident.
* **Why it matters**: Professional syndicates operate in mobilization bursts: scouting, coordination, execution, and rapid dispersal.
* **Math**:
  $$\text{Ratio} = \frac{\text{Calls}_{[-48\text{h}, 0]}}{\frac{2}{7} \times \text{Calls}_{[-9\text{d}, -2\text{d}]}} \quad \text{Condition: Ratio} > 3.0$$

#### 4. New Connection Influx (`NEW_CONNECTION` — Weight: 0.15)
* **What it catches**: Links established for the first time within 30 days of the criminal act.
* **Why it matters**: Established rings recruit fresh, disposable "mules" or SIM providers specifically for an upcoming operation. Stable, long-term familial ties are ignored; sudden fresh connections trigger investigative scrutiny.

#### 5. Star Topology / Compartmentalization (`STAR` — Weight: 0.10)
* **What it catches**: Strict hub-and-spoke topology with zero or near-zero peer-to-peer lateral connections.
* **Why it matters**: Classical covert syndicate architecture enforces compartmentalization: ground operatives must not know each other so that if one is arrested, they cannot expose co-conspirators.
* **Math**: Local clustering coefficient $C_i$:
  $$C_i = \frac{2 \cdot |\{e_{jk}: v_j, v_k \in N_i, \, e_{jk} \in E\}|}{k_i(k_i - 1)} < 0.3 \quad \land \quad k_i \ge 5$$

#### 6. Operational Fade-Out (`FADEOUT` — Weight: 0.05)
* **What it catches**: Complete or near-total activity blackout right before an incident.
* **Why it matters**: Criminals switch to encrypted channels, burn handsets, or maintain radio silence to establish plausible alibis. TrustLens treats abnormal absence of expected communication as an active investigative signal.

#### 7. Louvain Community Modularity (`COMMUNITY` — Weight: 0.05)
* **What it catches**: Natural clustering of co-conspirators into functional units (e.g., Core Ring vs. Mule Pool vs. Recruiter Network).
* **Math**: Greedy modularity maximization ($Q$):
  $$Q = \frac{1}{2m} \sum_{ij} \left[ A_{ij} - \frac{k_i k_j}{2m} \right] \delta(c_i, c_j)$$
* **Investigative Output**: Partitions suspects into distinct operational clusters without requiring predefined cluster numbers ($k$).

---

### 2.3 Mathematical Priority Score Aggregation

The final investigative ranking score $S \in [0.0, 10.0]$ is computed as:

$$S = 10 \times \left( \frac{\sum_{k \in \mathcal{H}} w_k \cdot f_k}{\sum_{k \in \mathcal{H}} w_k} \right)$$

Where:
- $\mathcal{H} = \{\text{HUB}, \text{BROKER}, \text{BURST}, \text{NEW\_CONNECTION}, \text{STAR}, \text{FADEOUT}, \text{COMMUNITY}\}$
- $w_k \in [0, 1]$ is the heuristic weight (default values sum to $1.0$).
- $f_k \in \{0, 1\}$ indicates whether heuristic $k$ fired for the subject.

#### Human-in-the-Loop Re-weighting:
Investigators can adjust weights live in the UI (`WhyFlaggedPanel.tsx`). The formula dynamically recomputes the score and maps it instantly to the **Color Psychology Threat Spectrum** ($S \ge 7.0 \rightarrow$ Critical Red; $5.0 \le S < 7.0 \rightarrow$ Elevated Orange; etc.), while saving analyst adjustments to the tamper-evident audit log.

---

## 3. 3-Minute Live Demo Choreography (Winning Script)

| Time | Screen / Action | Verbatim Dialogue |
| :--- | :--- | :--- |
| **0:00 – 0:35** | **Home / Slide** | *"Judges, when a cyber-fraud or human trafficking ring operates across state lines, police officers are overwhelmed with thousands of rows of telecom records and bank dumps. Connecting these records takes weeks, and one wrong merge destroys an innocent life. This is TrustLens."* |
| **0:35 – 1:05** | **`/ingest` → `/resolve`** | *(Upload/Commit CSV → Switch to Resolve)*<br>*"We ingest real-world heterogeneous data. But in India, hundreds of citizens share names like 'Rahul Sharma'. Watch our Refusal Engine: Name similarity is 96%, but TrustLens displays a **REFUSE Card** because father names and cell towers conflict. We prevent unlawful detentions before they happen."* |
| **1:05 – 1:55** | **`/` (Dashboard Graph)** | *(Click Projection View → Hover on Legend → Click Rahul Sharma)*<br>*"Here is our case graph. Rather than showing confusing cell towers, we project the network into a **Person-to-Person topology**. Notice the radiant halos? Based on **Color Psychology**, Rahul Sharma radiates a Crimson Red aura indicating Critical Threat (Score 9.0). In 'Why Flagged?', we break down the 7 deterministic heuristics with live re-weighting sliders and verbatim evidence chips."* |
| **1:55 – 2:30** | **`/trust` (Audit Chain)** | *(Click 'Verify Chain' [Green] → Click 'Tamper Demo' [Red Breach])*<br>*"Defense attorneys always challenge digital evidence integrity. TrustLens runs an in-browser SHA-256 hash-chain. The chain is intact. If an insider modifies a single byte, clicking Verify instantly isolates the exact block of corruption."* |
| **2:30 – 3:00** | **`/report/p_rahul`** | *(Click 'Export PDF' / Show Dossier)*<br>*"Finally, TrustLens compiles a complete, court-ready dossier under Section 65B of the Indian Evidence Act: subject assessment, money trail, timeline, and cryptographic evidence manifest. Human-in-the-loop, zero black-box liability. Thank you."* |

---

## 4. High-Frequency Questions & Answers for Judges

### Category A: Technical & System Architecture

#### Q1: "What is your underlying tech stack, and can this run completely offline?"
> **Answer**: 
> *"Yes. The frontend is built with React 19, TypeScript, and Vite, using Cytoscape.js (`fcose` physics layout) and Web Crypto API. It is completely client-operable offline in air-gapped police environments. For server-scale deployments, we have a lightweight Python FastAPI + NetworkX microservice that seamlessly swaps to a Neo4j Graph Data Science (GDS) backend for multi-million node graphs."*

#### Q2: "How do you project a multi-modal graph into a Person-Person network?"
> **Answer**: 
> *"A raw criminal graph contains heterogeneous nodes: Person, Phone, Account, Vehicle, and Location. If two persons call the same handset (IMEI sharing), send funds through intermediary accounts (mule path), or co-travel in a vehicle, TrustLens computes a bipartite projection where edge weight $W(A, B) = \sum \alpha_i \cdot \text{Interaction}_i(A, B)$. Centrality and Louvain community detection run strictly on this projection, preventing cell towers or bank branches from artificially ranking as 'kingpins'."*

#### Q3: "How does the SHA-256 hash chain work without a public blockchain?"
> **Answer**: 
> *"Public blockchains are unsuitable for law enforcement: they charge gas fees, incur high latency, and leak suspect metadata publicly, violating Section 8 of the DPDP Act 2023. Our system uses an internal sequential hash-chain: $\text{Hash}_i = \text{SHA-256}(\text{Hash}_{i-1} \parallel \text{Payload} \parallel \text{Actor} \parallel \text{Timestamp})$. It delivers 100% of the mathematical tamper-evidence of a blockchain with microsecond speed and zero infrastructure cost."*

---

### Category B: Algorithmic & Investigative Heuristics

#### Q4: "Why use 7 heuristics instead of a Deep Learning / GNN model?"
> **Answer**: 
> *"In criminal prosecution, a judge or defense advocate will not accept: 'The neural network gave a 0.89 probability.' Black-box models are inadmissible without explainability. Our 7 heuristics ($HUB$, $BROKER$, $BURST$, $STAR$, $NEW\_CONNECTION$, $FADEOUT$, $COMMUNITY$) are based on proven criminology graph theory. Every point in the 0–10 score can be mapped back to an exact phone call, transaction date, or network position."*

#### Q5: "How does TrustLens defeat micro-transfer structuring in money-mule rings?"
> **Answer**: 
> *"Criminal syndicates bypass ₹50,000 automated banking AML flags by splitting ₹10,00,000 into dozens of small UPI transfers across layered mule accounts. Rather than analyzing single transactions, TrustLens tracks multi-hop graph topology: our 'Money Path' highlight and Broker/Star heuristics trace the fan-out and re-consolidation of funds into central cash-out nodes regardless of how many intermediate hops are used."*

#### Q6: "Explain the Color Psychology Threat Spectrum."
> **Answer**: 
> *"Cognitive overload is a major hazard in criminal intelligence. Rather than arbitrary random colors, we designed a 5-tier threat spectrum grounded in cognitive ergonomics: Crimson Red stimulates the amygdala for immediate critical containment (Kingpins); Flame Orange promotes heightened active alertness for key handlers; Amber Yellow commands focal scrutiny for caution and verification; Cool Cyan enables calm, objective analysis of peripheral contacts; and Emerald Green signals verified legitimate parties."*

---

### Category C: Legal, Ethics & Regulatory Compliance

#### Q7: "How is TrustLens compliant with the Digital Personal Data Protection (DPDP) Act, 2023?"
> **Answer**: 
> *"Section 17 of the DPDP Act provides explicit exemptions for lawful criminal investigation and prevention of offenses by state agencies. However, TrustLens goes beyond minimum compliance: we implement Role-Based Access Control (analyst, investigator, supervisor), immutable audit trails recording every entity view, and a strict Human-in-the-Loop policy where the system produces ranking signals, never automated judicial decisions."*

#### Q8: "Is this report admissible in an Indian court under Section 65B of the Indian Evidence Act?"
> **Answer**: 
> *"Yes. Section 65B requires proof of computer system integrity, identifying the person in lawful control, and demonstrating that data was not altered during storage. Our court-ready report automatically prints the Officer ID, generation timestamp, SHA-256 evidence manifest hashes, and mathematical formula breakdowns, providing an airtight evidentiary trail for prosecution."*

---

## 5. The HARDEST Questions Judges Can Ask & How to Defend

---

### 🔥 Hard Question #1 (Graph Scalability Trap):
> **"Cytoscape in the browser will crash when dealing with a state-wide CDR dump containing 5 million calls. How does your system survive real-world scale?"**

* **Judge's Intent**: Checking if you built a toy demo or understand real data engineering.
* **Your Bulletproof Defense**:
  > *"That is precisely why we architected a two-tier pipeline. In real-world police operations, no human investigator can visually inspect 5 million raw nodes on one canvas anyway. 
  > 
  > 1. **Server-Side Reduction**: High-throughput ingestion runs in our Python/FastAPI backend backed by **Neo4j Graph Data Science (GDS)**. 
  > 2. **K-Core and Ego-Graph Filtering**: We execute server-side Louvain community detection and degree pruning to extract the top-K active sub-graphs and focal suspect ego-networks (typically 200–2,000 nodes).
  > 3. **Client-Side Rendering**: Cytoscape.js only renders the active investigative cluster with hardware-accelerated canvas/WebGL rendering, maintaining a smooth 60 FPS while the heavy multi-million edge math stays in the database engine."*

---

### 🔥 Hard Question #2 (Adversarial Evasion / Sybil Attack):
> **"Smart cybercriminals know about graph centrality. What if the syndicate leader never calls anyone directly, uses burner phones once, and routes all orders through cutouts? Your Hub heuristic will fail."**

* **Judge's Intent**: Testing if you understand organized crime tactics (burner SIMs, cut-outs, sleeper nodes).
* **Your Bulletproof Defense**:
  > *"That is the exact reason why $HUB$ is only 1 of our 7 heuristics. Criminal kingpins deliberately keep their degree low to evade hub detection. But they cannot evade three other mathematical footprints:
  > 
  > 1. **Broker Centrality ($BROKER$)**: Even if the kingpin speaks to only 2 people, those 2 people bridge two disconnected operations (e.g., procurement and money laundering). Betweenness centrality spikes regardless of low call volume.
  > 2. **IMEI Handset Pivot**: Criminals swap SIM cards frequently, but budget limitations or complacency mean they reuse handsets. Our IMEI pivot collapses multiple burner identities onto the physical device hardware.
  > 3. **Fade-Out Detection ($FADEOUT$)**: When a coordinator goes completely silent right before a coordinated strike, our temporal heuristic flags that anomalous inactivity as a deliberate operational blackout."*

---

### 🔥 Hard Question #3 (The Hallucination & False Positive Liability):
> **"If your system merges an innocent person's bank account with a drug cartel and police arrest them, who is liable? Why shouldn't police just stick to manual verification?"**

* **Judge's Intent**: Testing ethical responsibility, AI governance, and operational safety.
* **Your Bulletproof Defense**:
  > *"Manual verification is already failing: innocent citizens are routinely harassed because an analyst mistyped an Excel filter or matched a name superficially. 
  > 
  > TrustLens is specifically designed to eliminate this liability through three strict safeguards:
  > 1. **The REFUSE Engine**: Unlike traditional systems that greedily merge similar records, TrustLens refuses merges if conflicting father names, different states, or incompatible age brackets exist.
  > 2. **Zero Automated Adverse Action**: The software is legally configured as an investigative aid, not an arrest authorization. A police officer must sign their credentials on the report.
  > 3. **Audit Trail Accountability**: Every manual override or merge is cryptographically signed into the SHA-256 ledger with officer badge ID and timestamp, establishing clear legal accountability."*

---

### 🔥 Hard Question #4 (Phonetic & Regional Language Ambiguity):
> **"In Indian FIRs, a name like 'Mukesh' can be written as 'Mukeysh', 'मकेश', or misspelled by the head constable. How can regex and heuristics handle dialectal noise without an LLM?"**

* **Judge's Intent**: Testing your linguistic preprocessing and handling of messy Indian FIR data.
* **Your Bulletproof Defense**:
  > *"We use a layered deterministic-to-phonetic pipeline:
  > 1. **First-Pass Hard Token Matching**: 10-digit mobile numbers, 15-digit IMEIs, IFSC/Account numbers, and vehicle registration numbers are invariant across languages and have zero spelling ambiguity.
  > 2. **Indic Phonetic Tokenization**: For text labels, we use double-metaphone algorithms tuned for Indian phonology alongside Hindi gazetteers, matching transliterations like 'राहुल' to 'Rahul'.
  > 3. **Multi-Signal Graph Weighting**: We never merge on name alone. Even with 100% name match, confidence remains under 40% unless backed by a shared IMEI, co-location in the same cell tower, or financial transaction. In messy police data, graph context disambiguates names, not just string similarity."*

---

### 🔥 Hard Question #5 (Public Blockchain vs Internal Ledger Skepticism):
> **"If your SHA-256 hash-chain is stored in local storage or on the police server, what stops a root administrator or corrupt officer from editing the code and recalculating the entire hash chain from scratch?"**

* **Judge's Intent**: Testing your cryptographic threat modeling.
* **Your Bulletproof Defense**:
  > *"An insider with root access can alter a local database, but in our enterprise deployment architecture, the root hash is periodically committed using a **Dual-Key Anchor**:
  > 1. **Cryptographic Key Signing**: Each block is signed with the investigating officer's hardware token (e.g., e-Sign / PKI smart card). Re-computing the chain requires private keys the root administrator does not possess.
  > 2. **State Repository Anchoring**: Every midnight, the tip of the hash chain (the 32-byte digest) is mirrored to the state CCTNS master registry or timestamped via a National Informatics Centre (NIC) trusted time server. 
  > 
  > Even if a rogue server admin recomputes local hashes, the daily digest will mismatch the external anchor, immediately exposing the tampering."*

---

### 🔥 Hard Question #6 (Real-World Commercial Competitor Comparison):
> **"Why would a state police department pay for TrustLens when they already have access to CCTNS or can license IBM i2 Analyst's Notebook?"**

* **Judge's Intent**: Testing market viability, government procurement realism, and competitive edge.
* **Your Bulletproof Defense**:
  > *"CCTNS is an operational record-keeping database (a digital filing cabinet), not a network intelligence platform; it does not compute centrality or detect mule rings. 
  > 
  > On the other hand, **IBM i2 Analyst's Notebook** costs upwards of ₹50–80 Lakhs per license, requires months of specialized training, relies on manual link-drawing, and cannot ingest Indian payment logs (UPI, PhonePe, FASTag) natively. 
  > 
  > TrustLens is:
  > - **Purpose-built for Indian schemas** (UPI, CDR, VAHAN, CCTNS FIRs).
  > - **Web-native and intuitive**: Zero training curve for beat constables and cyber-cell inspectors.
  > - **100% Explainable**: Meets Indian Evidence Act Section 65B requirements at a fraction of the cost of foreign legacy suites."*

---

## 6. Quick Reference Mental Cheat-Sheet (Keep This in Mind on Stage)

| When Judges Ask About... | Your Instant Reflex Keyword |
| :--- | :--- |
| **Wrongful arrests / Ethics** | *"Human-in-the-Loop + REFUSE Cards (Hard Discriminators)"* |
| **AI black-box concerns** | *"7 deterministic graph heuristics, 100% explainable on the witness stand"* |
| **Tampering / Evidence integrity** | *"Web Crypto SHA-256 hash-chain custody log compliant with Section 65B"* |
| **Scalability with millions of logs** | *"Bipartite Person Projection + Neo4j Graph Data Science backend"* |
| **Adversarial criminals / Burner phones** | *"Betweenness Centrality + IMEI handset pivot + Fade-out temporal detection"* |
| **Visual design & aesthetics** | *"Color Psychology Threat Spectrum grounded in cognitive ergonomics"* |
