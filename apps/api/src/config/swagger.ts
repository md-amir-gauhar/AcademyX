import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QueztLearn API Documentation",
      version: "1.0.0",
      description:
        "API documentation for QueztLearn service - A learning management platform",
      contact: {
        name: "QueztLearn Team",
        email: "support@queztlearn.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://api.queztlearn.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "object",
              description: "Additional error details (only in development)",
            },
          },
        },
        Organization: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              minLength: 3,
              maxLength: 255,
              example: "Acme Corporation",
            },
            slug: {
              type: "string",
              minLength: 3,
              maxLength: 255,
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              example: "acme-corporation",
              description:
                "URL-friendly slug (lowercase, alphanumeric, hyphens only)",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-10-22T10:30:00Z",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174001",
            },
            organizationId: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            username: {
              type: "string",
              example: "johndoe",
            },
            role: {
              type: "string",
              enum: ["ADMIN", "TEACHER", "GUEST", "STUDENT"],
              example: "ADMIN",
            },
            isVerified: {
              type: "boolean",
              example: false,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-10-22T10:30:00Z",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                user: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
            message: {
              type: "string",
              example: "Login successful",
            },
          },
        },
        TestSeries: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            exam: {
              type: "string",
              enum: [
                "JEE",
                "NEET",
                "UPSC",
                "BANK",
                "SSC",
                "GATE",
                "CAT",
                "NDA",
                "CLAT",
                "OTHER",
              ],
            },
            title: {
              type: "string",
            },
            slug: {
              type: "string",
            },
            description: {
              type: "object",
            },
            imageUrl: {
              type: "string",
            },
            totalPrice: {
              type: "number",
            },
            discountPercentage: {
              type: "number",
            },
            finalPrice: {
              type: "number",
            },
            isFree: {
              type: "boolean",
            },
            durationDays: {
              type: "integer",
            },
            isEnrolled: {
              type: "boolean",
            },
            enrollmentDetails: {
              type: "object",
              nullable: true,
            },
          },
        },
        Batch: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            slug: {
              type: "string",
            },
            description: {
              type: "object",
            },
            imageUrl: {
              type: "string",
            },
            totalPrice: {
              type: "number",
            },
            discountPercentage: {
              type: "number",
            },
            startDate: {
              type: "string",
              format: "date-time",
            },
            endDate: {
              type: "string",
              format: "date-time",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
            },
            isPurchased: {
              type: "boolean",
              description:
                "Client-only: Whether the user has purchased this batch",
            },
          },
        },
        Subject: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            batchId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
              nullable: true,
            },
            displayOrder: {
              type: "integer",
            },
            teachers: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Teacher",
              },
            },
          },
        },
        Chapter: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            subjectId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
              nullable: true,
            },
            displayOrder: {
              type: "integer",
            },
          },
        },
        Topic: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            chapterId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
              nullable: true,
            },
            displayOrder: {
              type: "integer",
            },
          },
        },
        Content: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            topicId: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
            },
            type: {
              type: "string",
              enum: ["VIDEO", "PDF", "ARTICLE", "QUIZ"],
            },
            url: {
              type: "string",
            },
            duration: {
              type: "integer",
              description: "Duration in seconds for video content",
              nullable: true,
            },
            displayOrder: {
              type: "integer",
            },
          },
        },
        Schedule: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            organizationId: {
              type: "string",
              format: "uuid",
            },
            topicId: {
              type: "string",
              format: "uuid",
            },
            batchId: {
              type: "string",
              format: "uuid",
            },
            subjectId: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
              minLength: 3,
              maxLength: 255,
            },
            description: {
              type: "string",
              nullable: true,
            },
            subjectName: {
              type: "string",
              description: "Subject name for display",
            },
            youtubeLink: {
              type: "string",
              description: "YouTube embed URL",
            },
            scheduledAt: {
              type: "string",
              format: "date-time",
            },
            duration: {
              type: "integer",
              description: "Duration in minutes",
            },
            status: {
              type: "string",
              enum: ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"],
            },
            teacherId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            thumbnailUrl: {
              type: "string",
              nullable: true,
            },
            notifyBeforeMinutes: {
              type: "integer",
              default: 30,
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
              nullable: true,
            },
            reminderSent: {
              type: "boolean",
            },
            contentId: {
              type: "string",
              format: "uuid",
              nullable: true,
              description: "Auto-created content after completion",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Teacher: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              type: "string",
              nullable: true,
            },
            bio: {
              type: "string",
              nullable: true,
            },
            profilePictureUrl: {
              type: "string",
              nullable: true,
            },
            specialization: {
              type: "string",
              nullable: true,
            },
          },
        },
        Test: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            testSeriesId: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
            },
            slug: {
              type: "string",
            },
            description: {
              type: "object",
              nullable: true,
            },
            durationMinutes: {
              type: "integer",
            },
            totalMarks: {
              type: "number",
            },
            passingMarks: {
              type: "number",
            },
            isFree: {
              type: "boolean",
            },
            isPublished: {
              type: "boolean",
            },
            sectionCount: {
              type: "integer",
            },
            questionCount: {
              type: "integer",
            },
            showAnswersAfterSubmit: {
              type: "boolean",
            },
            allowReview: {
              type: "boolean",
            },
            shuffleQuestions: {
              type: "boolean",
            },
          },
        },
        Section: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            testId: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
            },
            description: {
              type: "string",
              nullable: true,
            },
            displayOrder: {
              type: "integer",
            },
            questionCount: {
              type: "integer",
            },
            totalMarks: {
              type: "number",
            },
          },
        },
        Question: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            sectionId: {
              type: "string",
              format: "uuid",
            },
            text: {
              type: "string",
            },
            imageUrl: {
              type: "string",
              nullable: true,
            },
            type: {
              type: "string",
              enum: ["MCQ", "FILL_BLANK", "NUMERICAL", "TRUE_FALSE"],
            },
            difficulty: {
              type: "string",
              enum: ["EASY", "MEDIUM", "HARD"],
            },
            marks: {
              type: "number",
            },
            negativeMarks: {
              type: "number",
            },
            displayOrder: {
              type: "integer",
            },
            options: {
              type: "array",
              items: {
                $ref: "#/components/schemas/QuestionOption",
              },
            },
          },
        },
        QuestionOption: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            text: {
              type: "string",
            },
            imageUrl: {
              type: "string",
              nullable: true,
            },
            isCorrect: {
              type: "boolean",
              description:
                "Only visible to admins, not to students during test",
            },
            displayOrder: {
              type: "integer",
            },
          },
        },
        TestAttempt: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            testId: {
              type: "string",
              format: "uuid",
            },
            userId: {
              type: "string",
              format: "uuid",
            },
            attemptNumber: {
              type: "integer",
            },
            startedAt: {
              type: "string",
              format: "date-time",
            },
            submittedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            totalScore: {
              type: "number",
            },
            percentage: {
              type: "number",
            },
            isCompleted: {
              type: "boolean",
            },
            correctAnswers: {
              type: "integer",
            },
            incorrectAnswers: {
              type: "integer",
            },
            unattemptedQuestions: {
              type: "integer",
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            orderId: {
              type: "string",
              format: "uuid",
            },
            razorpayOrderId: {
              type: "string",
            },
            amount: {
              type: "number",
            },
            currency: {
              type: "string",
              example: "INR",
            },
            key: {
              type: "string",
              description: "Razorpay key for frontend integration",
            },
            originalPrice: {
              type: "number",
            },
            discountAmount: {
              type: "number",
            },
            finalPrice: {
              type: "number",
            },
          },
        },
        PaymentVerification: {
          type: "object",
          required: [
            "orderId",
            "razorpayPaymentId",
            "razorpayOrderId",
            "razorpaySignature",
          ],
          properties: {
            orderId: {
              type: "string",
              format: "uuid",
              description: "Internal order ID",
            },
            razorpayPaymentId: {
              type: "string",
              description: "Razorpay payment ID from successful payment",
            },
            razorpayOrderId: {
              type: "string",
              description: "Razorpay order ID",
            },
            razorpaySignature: {
              type: "string",
              description: "Razorpay signature for verification",
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            currentPage: {
              type: "integer",
            },
            totalPages: {
              type: "integer",
            },
            totalCount: {
              type: "integer",
            },
            limit: {
              type: "integer",
            },
            hasNext: {
              type: "boolean",
            },
            hasPrevious: {
              type: "boolean",
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ForbiddenError: {
          description: "User does not have permission to access this resource",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
    tags: [
      // Organization & Config
      {
        name: "Organizations",
        description: "Organization management endpoints",
      },
      {
        name: "Organization Config (Admin)",
        description:
          "Organization configuration management with full access to sensitive data (Admin only)",
      },
      {
        name: "Organization Config (Client)",
        description: "Public organization configuration without sensitive data",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },

      // Authentication
      {
        name: "Authentication (Admin)",
        description: "Admin/Teacher authentication and registration endpoints",
      },
      {
        name: "Authentication (Client)",
        description: "Student authentication and registration endpoints",
      },

      // Admin - Batches
      {
        name: "Batches (Admin)",
        description: "Admin endpoints for managing batches",
      },
      {
        name: "Teachers (Admin)",
        description: "Admin endpoints for managing teachers",
      },
      {
        name: "Subjects (Admin)",
        description: "Admin endpoints for managing subjects within batches",
      },
      {
        name: "Chapters (Admin)",
        description: "Admin endpoints for managing chapters within subjects",
      },
      {
        name: "Topics (Admin)",
        description: "Admin endpoints for managing topics within chapters",
      },
      {
        name: "Contents (Admin)",
        description: "Admin endpoints for managing learning content",
      },
      {
        name: "Schedules (Admin)",
        description: "Admin endpoints for managing live class schedules",
      },

      // Client - Batches
      {
        name: "Batches (Client)",
        description: "Client endpoints for browsing and purchasing batches",
      },
      {
        name: "Subjects (Client)",
        description: "Client endpoints for viewing purchased batch subjects",
      },
      {
        name: "Chapters (Client)",
        description:
          "Client endpoints for viewing chapters in purchased batches",
      },
      {
        name: "Topics (Client)",
        description: "Client endpoints for viewing topics in purchased batches",
      },
      {
        name: "Contents (Client)",
        description: "Client endpoints for accessing learning content",
      },
      {
        name: "Schedules (Client)",
        description: "Client endpoints for viewing live class schedules",
      },

      // Admin - Test Series
      {
        name: "Test Series (Admin)",
        description: "Admin endpoints for managing test series",
      },
      {
        name: "Tests (Admin)",
        description:
          "Admin endpoints for managing tests, sections, and questions",
      },

      // Client - Test Series
      {
        name: "Test Series (Client)",
        description:
          "Client endpoints for browsing and enrolling in test series",
      },
      {
        name: "Tests (Client)",
        description: "Client endpoints for viewing published tests",
      },
      {
        name: "Test Attempts (Client)",
        description: "Client endpoints for taking tests and viewing results",
      },

      // Utilities
      {
        name: "Upload",
        description: "File upload endpoints",
      },
      {
        name: "Cache Management (Admin)",
        description: "Cache management and statistics endpoints (Admin only)",
      },
      {
        name: "Health",
        description: "Health check and system status endpoints",
      },
    ],
  },
  // Scan all route files in the project
  apis: [
    // Root routes
    "./src/routes/*.ts",
    "./src/routes/*.js",

    // Admin routes
    "./src/routes/admin/*.ts",
    "./src/routes/admin/*.js",

    // Client routes
    "./src/routes/client/*.ts",
    "./src/routes/client/*.js",

    // Test series routes (legacy/shared)
    "./src/routes/test-series/*.ts",
    "./src/routes/test-series/*.js",

    // Main app file
    "./src/index.ts",
    "./src/index.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
