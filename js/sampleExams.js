/**
 * Pre-loaded Certification Exam Dumps Dataset
 * Compatible with VCE, ExamTopics, Pass4Sure, Whizlabs formats
 */

export const SAMPLE_EXAMS = {
  "aws-saa": {
    id: "aws-saa",
    title: "AWS Certified Solutions Architect - Associate (SAA-C03)",
    vendor: "Amazon Web Services",
    icon: "☁️",
    badgeColor: "#ff9900",
    description: "Diseño de arquitecturas en la nube resientes, de alto rendimiento y rentables.",
    timeLimitMinutes: 30,
    passingScorePercentage: 72,
    questions: [
      {
        id: 1,
        question: "A company needs to host a highly available web application on AWS with automatic scaling. The database tier must store structured data with sub-millisecond read latency. Which AWS services should be selected?",
        options: [
          "Amazon EC2 Auto Scaling + Amazon DynamoDB with DAX",
          "Amazon S3 + Amazon Athena",
          "AWS Lambda + Amazon RDS Single-AZ",
          "Amazon ECS + Amazon ElastiCache Redis only"
        ],
        correctAnswerIndex: 0,
        explanation: "DynamoDB with DynamoDB Accelerator (DAX) provides sub-millisecond read latency for structured data, combined with EC2 Auto Scaling for high availability.",
        domain: "Design High-Performing Architectures"
      },
      {
        id: 2,
        question: "A Solutions Architect is designing a disaster recovery strategy for a mission-critical application. The RTO must be less than 15 minutes and the RPO must be near zero. Which strategy is best?",
        options: [
          "Backup and Restore",
          "Pilot Light",
          "Warm Standby",
          "Multi-Region Active-Active with Aurora Global Database"
        ],
        correctAnswerIndex: 3,
        explanation: "Multi-Region Active-Active deployment with Amazon Aurora Global Database provides near-zero RPO (replication lag < 1 second) and RTO < 15 minutes.",
        domain: "Design Resilient Architectures"
      },
      {
        id: 3,
        question: "An application running on EC2 instances needs to securely access an Amazon S3 bucket without embedding AWS credentials in code. What is the recommended approach?",
        options: [
          "Store AWS Access Keys in a local configuration file on the EC2 instance.",
          "Assign an IAM Role with appropriate S3 policies to the EC2 instance.",
          "Use AWS Secrets Manager to store IAM User password.",
          "Pass credentials as environment variables in launch templates."
        ],
        correctAnswerIndex: 1,
        explanation: "Attaching an IAM Role to EC2 instance metadata provides temporary, automatically rotated security credentials without hardcoding secrets.",
        domain: "Design Secure Applications"
      },
      {
        id: 4,
        question: "Which S3 storage class is best suited for data that is infrequently accessed, requires immediate retrieval within milliseconds, and minimizes storage cost?",
        options: [
          "S3 Standard",
          "S3 Standard-Infrequent Access (S3 Standard-IA)",
          "S3 Glacier Flexible Retrieval",
          "S3 Glacier Deep Archive"
        ],
        correctAnswerIndex: 1,
        explanation: "S3 Standard-IA is designed for data accessed less frequently but requiring millisecond access when needed at lower storage costs.",
        domain: "Design Cost-Optimized Architectures"
      },
      {
        id: 5,
        question: "A company wants to decouple a monolithic application using microservices. Services must send messages asynchronously, ensuring no message is lost if a downstream service goes offline. Which pair of services should be used?",
        options: [
          "Amazon SNS and Amazon SQS",
          "AWS Step Functions and AWS Batch",
          "Amazon Route 53 and CloudFront",
          "AWS Glue and Kinesis Firehose"
        ],
        correctAnswerIndex: 0,
        explanation: "Amazon SNS (fan-out notifications) combined with Amazon SQS (message queuing) guarantees message persistence and decoupling.",
        domain: "Design High-Performing Architectures"
      }
    ]
  },

  "azure-az900": {
    id: "azure-az900",
    title: "Microsoft Azure Fundamentals (AZ-900)",
    vendor: "Microsoft Azure",
    icon: "🟦",
    badgeColor: "#0078d4",
    description: "Conceptos fundamentales de Cloud Computing, servicios principales de Azure, seguridad y gobernanza.",
    timeLimitMinutes: 25,
    passingScorePercentage: 70,
    questions: [
      {
        id: 1,
        question: "Which Azure cloud deployment model provides maximum control over infrastructure while sharing hardware costs?",
        options: [
          "Public Cloud",
          "Private Cloud",
          "Hybrid Cloud",
          "Multi-Cloud"
        ],
        correctAnswerIndex: 2,
        explanation: "Hybrid cloud combines on-premises infrastructure (private) with public cloud services for flexibility and compliance control.",
        domain: "Cloud Concepts"
      },
      {
        id: 2,
        question: "An organization needs a serverless compute service in Azure that executes code in response to events without managing infrastructure. Which service should they choose?",
        options: [
          "Azure Virtual Machines",
          "Azure Logic Apps",
          "Azure Functions",
          "Azure Kubernetes Service (AKS)"
        ],
        correctAnswerIndex: 2,
        explanation: "Azure Functions is an event-driven serverless compute service that runs code on-demand.",
        domain: "Azure Architecture and Services"
      },
      {
        id: 3,
        question: "Which feature of Microsoft Entra ID (formerly Azure Active Directory) forces users to verify their identity using a phone app or SMS in addition to password?",
        options: [
          "Single Sign-On (SSO)",
          "Multi-Factor Authentication (MFA)",
          "Role-Based Access Control (RBAC)",
          "Azure Key Vault"
        ],
        correctAnswerIndex: 1,
        explanation: "Multi-Factor Authentication (MFA) adds a secondary verification step to prevent unauthorized access.",
        domain: "Azure Management and Governance"
      }
    ]
  },

  "gcp-pca": {
    id: "gcp-pca",
    title: "Google Cloud Professional Cloud Architect (PCA)",
    vendor: "Google Cloud",
    icon: "🌐",
    badgeColor: "#4285f4",
    description: "Arquitectura en GCP, diseño de infraestructura escalable, BigQuery, GKE e IAM.",
    timeLimitMinutes: 30,
    passingScorePercentage: 75,
    questions: [
      {
        id: 1,
        question: "A company requires a globally managed relational database service in GCP that offers ACIDs transactions, horizontal scalability, and 99.999% availability. Which GCP service satisfies these requirements?",
        options: [
          "Cloud Bigtable",
          "Cloud Spanner",
          "Cloud SQL",
          "BigQuery"
        ],
        correctAnswerIndex: 1,
        explanation: "Cloud Spanner is Google Cloud's fully managed, enterprise-grade, globally distributed relational database providing high availability and ACID compliance.",
        domain: "Design GCP Data Systems"
      },
      {
        id: 2,
        question: "Which Google Cloud IAM role allows a user to read all resources within a project but cannot modify any configuration or data?",
        options: [
          "roles/owner",
          "roles/editor",
          "roles/viewer",
          "roles/browser"
        ],
        correctAnswerIndex: 2,
        explanation: "The primitive Viewer role (roles/viewer) grants read-only access to existing resources and actions.",
        domain: "Security and Compliance"
      }
    ]
  },

  "comptia-sec": {
    id: "comptia-sec",
    title: "CompTIA Security+ (SY0-701)",
    vendor: "CompTIA",
    icon: "🛡️",
    badgeColor: "#ff0000",
    description: "Ciberseguridad, operaciones de seguridad, gestión de riesgos, criptografía y respuesta a incidentes.",
    timeLimitMinutes: 20,
    passingScorePercentage: 75,
    questions: [
      {
        id: 1,
        question: "A security analyst detects anomalous network traffic where an internal workstation is making repeated HTTPS connections to a suspicious external IP address at exact 5-minute intervals. What type of activity does this most likely represent?",
        options: [
          "Buffer overflow attack",
          "Command and Control (C2) beaconing",
          "ARP poisoning attack",
          "SQL injection exploit"
        ],
        correctAnswerIndex: 1,
        explanation: "C2 beaconing occurs when compromised hosts periodically check in with an attacker's Command and Control server at fixed intervals.",
        domain: "Threats, Attacks, and Vulnerabilities"
      },
      {
        id: 2,
        question: "Which cryptographic concept ensures that a sender cannot deny having sent a specific message or initiated a transaction?",
        options: [
          "Confidentiality",
          "Non-repudiation",
          "Steganography",
          "Obfuscation"
        ],
        correctAnswerIndex: 1,
        explanation: "Non-repudiation (achieved via digital signatures and PKI) proves the origin and authenticity of a transaction.",
        domain: "Architecture and Design"
      },
      {
        id: 3,
        question: "An organization wants to implement Zero Trust Architecture (ZTA). Which principle is fundamental to Zero Trust?",
        options: [
          "Trust everything inside the corporate firewall.",
          "Verify explicitly, use least privilege access, and assume breach.",
          "Use single-factor password authentication for speed.",
          "Disable network logging to save storage space."
        ],
        correctAnswerIndex: 1,
        explanation: "Zero Trust operates on the core pillars: Never Trust, Always Verify, Least Privilege, and Assume Breach.",
        domain: "Security Architecture"
      }
    ]
  },

  "ccna-200-301": {
    id: "ccna-200-301",
    title: "Cisco CCNA (200-301) Networking Essentials",
    vendor: "Cisco Systems",
    icon: "🔌",
    badgeColor: "#1ba0d7",
    description: "Fundamentos de redes, enrutamiento IP, switching VLAN, Spanning Tree y seguridad de capa 2.",
    timeLimitMinutes: 25,
    passingScorePercentage: 80,
    questions: [
      {
        id: 1,
        question: "What is the primary function of the Address Resolution Protocol (ARP)?",
        options: [
          "Map an IP address to a physical MAC address.",
          "Translate domain names to IP addresses.",
          "Assign dynamic IP addresses to network hosts.",
          "Encapsulate Layer 3 packets into Layer 4 segments."
        ],
        correctAnswerIndex: 0,
        explanation: "ARP resolves IPv4 addresses (Layer 3) to Ethernet MAC addresses (Layer 2) on a local network segment.",
        domain: "Network Fundamentals"
      },
      {
        id: 2,
        question: "Which administrative distance is assigned by default to a directly connected network interface on a Cisco router?",
        options: [
          "0",
          "1",
          "90",
          "110"
        ],
        correctAnswerIndex: 0,
        explanation: "Directly connected interfaces have an Administrative Distance (AD) of 0, representing the most trustworthy route source.",
        domain: "IP Routing Technologies"
      }
    ]
  },

  "k8s-cka": {
    id: "k8s-cka",
    title: "Kubernetes Certified Administrator (CKA)",
    vendor: "CNCF / Linux Foundation",
    icon: "☸️",
    badgeColor: "#326ce5",
    description: "Administración de clústeres Kubernetes, deployments, servicios, ingress y almacenamiento persistente.",
    timeLimitMinutes: 25,
    passingScorePercentage: 75,
    questions: [
      {
        id: 1,
        question: "Which Kubernetes resource object ensures that a specified number of Pod replicas are running at any given time across the cluster?",
        options: [
          "DaemonSet",
          "ReplicaSet",
          "Job",
          "ConfigMap"
        ],
        correctAnswerIndex: 1,
        explanation: "ReplicaSet maintains a stable set of replica Pods running at any given time.",
        domain: "Workloads & Scheduling"
      },
      {
        id: 2,
        question: "You need to expose a Pod internally within the Kubernetes cluster on a static IP without exposing it outside the cluster. Which Service type should you use?",
        options: [
          "ClusterIP",
          "NodePort",
          "LoadBalancer",
          "ExternalName"
        ],
        correctAnswerIndex: 0,
        explanation: "ClusterIP is the default service type that exposes the Service on an internal IP in the cluster.",
        domain: "Services & Networking"
      }
    ]
  },

  "cissp-sec": {
    id: "cissp-sec",
    title: "ISC2 CISSP Security Professional",
    vendor: "ISC2",
    icon: "🔐",
    badgeColor: "#e63946",
    description: "Los 8 dominios del CISSP: Gestión de riesgos, seguridad en redes, IAM y evaluación de seguridad.",
    timeLimitMinutes: 30,
    passingScorePercentage: 70,
    questions: [
      {
        id: 1,
        question: "During a BCP planning phase, which metric determines the maximum acceptable amount of data loss measured in time before significant damage occurs?",
        options: [
          "Recovery Time Objective (RTO)",
          "Recovery Point Objective (RPO)",
          "Maximum Tolerable Downtime (MTD)",
          "Mean Time Between Failures (MTBF)"
        ],
        correctAnswerIndex: 1,
        explanation: "RPO defines the maximum tolerable age of unrecovered data resulting from a disruption.",
        domain: "Security and Risk Management"
      }
    ]
  },

  "scrum-psm1": {
    id: "scrum-psm1",
    title: "Professional Scrum Master (PSM I)",
    vendor: "Scrum.org",
    icon: "🔄",
    badgeColor: "#00a896",
    description: "Principios de Agile & Scrum, roles (Scrum Master, Product Owner, Developers) y eventos de Sprint.",
    timeLimitMinutes: 20,
    passingScorePercentage: 85,
    questions: [
      {
        id: 1,
        question: "Who is accountable for creating a credible Plan for the Sprint in Scrum (the Sprint Backlog)?",
        options: [
          "The Scrum Master",
          "The Product Owner",
          "The Developers",
          "The Project Manager"
        ],
        correctAnswerIndex: 2,
        explanation: "The Developers are accountable for creating a plan for the Sprint (the Sprint Backlog).",
        domain: "Scrum Framework"
      }
    ]
  }
};
