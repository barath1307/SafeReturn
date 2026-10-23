const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("./models/User");
const Identity = require("./models/Identity");
const ContactRequest = require("./models/ContactRequest");
const authMiddleware = require("./middleware/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID);

// ===============================
// DATABASE
// ===============================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// ===============================
// GEMINI AI
// ===============================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ===============================
// MIDDLEWARE
// ===============================

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "2mb" }));

// ===============================
// UPLOAD DIRECTORY
// ===============================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===============================
// MULTER
// ===============================

const upload = multer({
  dest: uploadDir,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and WEBP images are allowed.")
      );
    }

    cb(null, true);
  },
});

// ===============================
// USER REGISTRATION
// ===============================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please sign in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account. Please try again.",
    });
  }
});

// ===============================
// USER LOGIN
// ===============================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google Sign-In. Please continue with Google.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to sign in. Please try again.",
    });
  }
});

// ===============================
// GOOGLE SIGN-IN / REGISTRATION
// ===============================

app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({ success: false, message: "Google Sign-In is not configured on the server." });
    }
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required." });
    }
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "Server authentication is not configured." });
    }

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ success: false, message: "Google account email could not be verified." });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (user) {
      // A verified Google email may be linked to an existing password account.
      if (!user.googleId) user.googleId = payload.sub;
      if (!user.name && payload.name) user.name = payload.name;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      user.authProvider = user.password ? "both" : "google";
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || email.split("@")[0],
        email,
        googleId: payload.sub,
        authProvider: "google",
        avatar: payload.picture || "",
      });
    }

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.json({
      success: true,
      message: "Google sign-in successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar || "", authProvider: user.authProvider },
    });
  } catch (error) {
    console.error("Google authentication error:", error.message);
    return res.status(401).json({ success: false, message: "Google sign-in could not be verified. Please try again." });
  }
});

// ===============================
// GEMINI TEMPORARY ERROR CHECK
// ===============================

function isTemporaryGeminiError(error) {
  const status =
    error?.status ||
    error?.statusCode ||
    error?.response?.status;

  const text = `${error?.message || ""} ${
    error?.statusText || ""
  }`.toLowerCase();

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes("overload") ||
    text.includes("temporarily unavailable") ||
    text.includes("service unavailable") ||
    text.includes("503")
  );
}

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ===============================
// AI ITEM ANALYSIS
// ===============================

app.post(
  "/api/analyze-item",
  upload.single("image"),
  async (req, res) => {
    let uploadedFilePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Item image is required.",
        });
      }

      uploadedFilePath = req.file.path;

      const imageBuffer = fs.readFileSync(uploadedFilePath);
      const base64Image = imageBuffer.toString("base64");

      const prompt = `
You are an AI assistant for a lost-and-found platform called SafeReturn.

Analyze the uploaded item image carefully.

Return ONLY valid JSON with these exact fields:

{
  "itemType": "",
  "brand": "",
  "color": "",
  "shape": "",
  "visualDetails": "",
  "confidence": 0
}

Rules:
- itemType: identify the likely item category.
- brand: identify a visible brand only if confidently recognizable.
  Otherwise use "Unknown".
- color: describe the main visible color.
- shape: describe the general physical shape.
- visualDetails: mention distinctive visible characteristics.
- confidence: a number from 0 to 100.
- Do not invent details that cannot reasonably be seen.
`;

      const request = {
        model: "gemini-3.5-flash-lite",

        contents: [
          {
            role: "user",

            parts: [
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: base64Image,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],

        config: {
          responseMimeType: "application/json",

          responseSchema: {
            type: "object",

            properties: {
              itemType: {
                type: "string",
              },

              brand: {
                type: "string",
              },

              color: {
                type: "string",
              },

              shape: {
                type: "string",
              },

              visualDetails: {
                type: "string",
              },

              confidence: {
                type: "number",
              },
            },

            required: [
              "itemType",
              "brand",
              "color",
              "shape",
              "visualDetails",
              "confidence",
            ],
          },
        },
      };

      let response;
      let lastError;

      // Retry temporary Gemini failures up to 3 attempts.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          response = await ai.models.generateContent(request);
          break;
        } catch (error) {
          lastError = error;

          if (
            !isTemporaryGeminiError(error) ||
            attempt === 2
          ) {
            throw error;
          }

          await wait(800 * (attempt + 1));
        }
      }

      if (!response) {
        throw lastError || new Error("AI returned no response.");
      }

      const rawText =
        typeof response.text === "function"
          ? response.text()
          : response.text;

      if (!rawText) {
        throw new Error("AI returned an empty response.");
      }

      const analysis = JSON.parse(rawText);

      return res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error("AI analysis error:", error.message);

      const temporary = isTemporaryGeminiError(error);

      return res.status(temporary ? 503 : 500).json({
        success: false,

        message: temporary
          ? "AI service is temporarily busy. Please wait a moment and try again."
          : "AI analysis failed. Please try another image.",

        retryable: temporary,
      });
    } finally {
      if (uploadedFilePath) {
        try {
          fs.unlinkSync(uploadedFilePath);
        } catch (deleteError) {
          console.error(
            "Temporary file cleanup failed:",
            deleteError.message
          );
        }
      }
    }
  }
);
// ===============================
// CREATE SAFERETURN IDENTITY
// ===============================

app.post(
  "/api/identities",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        itemName,
        category,
        description,
        imageName,
        analysis,
      } = req.body;

      if (
        !itemName?.trim() ||
        !analysis ||
        typeof analysis !== "object"
      ) {
        return res.status(400).json({
          success: false,
          message: "Item name and AI analysis are required.",
        });
      }

      let safeReturnId;
      let exists = true;

      while (exists) {
        safeReturnId =
          `SR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

        exists = await Identity.exists({
          safeReturnId,
        });
      }

      const identity = await Identity.create({
        safeReturnId,
        itemName: itemName.trim(),
        category: category || "Other",
        description: description || "",
        imageName: imageName || "",
        analysis,
        ownerId: req.user.id,
      });

      return res.status(201).json({
        success: true,
        message: "SafeReturn identity created successfully.",

        identity: {
          id: identity.safeReturnId,
          safeReturnId: identity.safeReturnId,
          itemName: identity.itemName,
          category: identity.category,
          description: identity.description,
          imageName: identity.imageName,
          analysis: identity.analysis,
          createdAt: identity.createdAt,
        },
      });
    } catch (error) {
      console.error("Identity creation error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to create SafeReturn identity.",
      });
    }
  }
);

// ===============================
// GET CURRENT USER'S ITEMS
// ===============================

app.get(
  "/api/identities/mine",
  authMiddleware,
  async (req, res) => {
    try {
      const identities = await Identity.find({
        ownerId: req.user.id,
      })
        .sort({ createdAt: -1 })
        .lean();

      const items = identities.map((identity) => ({
        ...identity,
        id: identity.safeReturnId,
        safeReturnId: identity.safeReturnId,
      }));

      return res.json({
        success: true,
        identities: items,
        items,
      });
    } catch (error) {
      console.error("Fetch my items error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch your items.",
      });
    }
  }
);

// ===============================
// DELETE IDENTITY — OWNER ONLY
// ===============================

app.delete(
  "/api/identities/:id",
  authMiddleware,
  async (req, res) => {
    try {
      const identity = await Identity.findOneAndDelete({
        safeReturnId: req.params.id,
        ownerId: req.user.id,
      });

      if (!identity) {
        return res.status(404).json({
          success: false,
          message:
            "Item not found or you do not have permission to delete it.",
        });
      }

      await ContactRequest.deleteMany({
        identity: identity._id,
      });

      return res.json({
        success: true,
        message: "Item deleted successfully.",
      });
    } catch (error) {
      console.error("Delete identity error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete item.",
      });
    }
  }
);

// ===============================
// PUBLIC GET IDENTITY — QR / FINDER
// ===============================

app.get("/api/identities/:id", async (req, res) => {
  try {
    const identity = await Identity.findOne({
      safeReturnId: req.params.id,
    })
      .select(
        "safeReturnId itemName category description imageName analysis createdAt"
      )
      .lean();

    if (!identity) {
      return res.status(404).json({
        success: false,
        message: "SafeReturn identity not found.",
      });
    }

    return res.json({
      success: true,

      identity: {
        ...identity,
        id: identity.safeReturnId,
      },
    });
  } catch (error) {
    console.error("Identity fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch SafeReturn identity.",
    });
  }
});
// ===============================
// CONTACT OWNER REQUEST — MONGODB
// ===============================

app.post("/api/contact-owner", async (req, res) => {
  try {
    let authenticatedUser = null;
    const authorization = req.headers.authorization || "";
    if (authorization.startsWith("Bearer ") && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
        if (decoded.userId) authenticatedUser = await User.findById(decoded.userId).select("name email");
      } catch (tokenError) {
        // Invalid/expired optional token does not prevent anonymous contact requests.
        authenticatedUser = null;
      }
    }
    const {
      safeReturnId,
      finderName,
      finderContact,
      message,
    } = req.body;

    if (
      !safeReturnId ||
      !finderName?.trim() ||
      !finderContact?.trim() ||
      !message?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const identity = await Identity.findOne({
  safeReturnId,
}).select("_id safeReturnId ownerId");
    if (!identity) {
      return res.status(404).json({
        success: false,
        message: "SafeReturn identity not found.",
      });
    }

    const contactRequest = await ContactRequest.create({
      safeReturnId,
      identity: identity._id,
      finderName: (authenticatedUser?.name || finderName).trim(),
      finderContact: (authenticatedUser?.email || finderContact).trim(),
      finderEmail: authenticatedUser?.email || "",
      message: message.trim(),
      
    });
// ===============================
// EMAIL NOTIFICATION TO ITEM OWNER — BREVO
// ===============================
console.log("EMAIL DEBUG: Contact request created");
console.log(
  "EMAIL DEBUG: Brevo configured =",
  Boolean(process.env.BREVO_API_KEY)
);
console.log("EMAIL DEBUG: Owner ID =", String(identity.ownerId || ""));

try {
  if (process.env.BREVO_API_KEY && identity.ownerId) {
    const owner = await User.findById(identity.ownerId)
      .select("name email")
      .lean();

    if (owner?.email) {
      const safeName = String(owner.name || "there")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: "SafeReturn",
              email: process.env.BREVO_FROM_EMAIL,
            },
            to: [
              {
                email: owner.email,
                name: owner.name || "SafeReturn User",
              },
            ],
            subject: "New SafeReturn contact request",
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #0f172a;">
                <h2 style="color: #0891b2;">New SafeReturn Request</h2>
                <p>Hello ${safeName},</p>
                <p>Someone has contacted you about your registered item.</p>
                <p><strong>SafeReturn ID:</strong> ${safeReturnId}</p>
                <p><strong>Request ID:</strong> ${contactRequest._id}</p>
                <p>Please sign in to SafeReturn and open your Owner Dashboard to view the message.</p>
                <p style="color: #64748b;">SafeReturn — Privacy-first Lost & Found</p>
              </div>
            `,
          }),
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error(
          "Brevo email error:",
          response.status,
          JSON.stringify(result)
        );
      } else {
        console.log("Owner email notification accepted by Brevo.");
      }
    } else {
      console.log("EMAIL DEBUG: Owner email not found");
    }
  } else {
    console.log("EMAIL DEBUG: Brevo API key or owner ID missing");
  }
} catch (emailError) {
  // Email failure must not cancel a successfully saved contact request.
  console.error(
    "Brevo email notification failed:",
    emailError.message
  );
}

    return res.status(201).json({
      success: true,
      message: "Your secure contact request has been submitted.",
      requestId: contactRequest._id,
    });
  } catch (error) {
    console.error("Contact request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to submit contact request.",
    });
  }
});

// ===============================
// GET CONTACT REQUESTS — OWNER ONLY
// ===============================

app.get(
  "/api/contact-requests/:safeReturnId",
  authMiddleware,
  async (req, res) => {
    try {
      const identity = await Identity.findOne({
        safeReturnId: req.params.safeReturnId,
        ownerId: req.user.id,
      }).select("_id safeReturnId");

      if (!identity) {
        return res.status(404).json({
          success: false,
          message:
            "Item not found or you do not have permission to view requests.",
        });
      }

      const requests = await ContactRequest.find({
        identity: identity._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.json({
        success: true,

        requests: requests.map((request) => ({
          ...request,
          id: request._id.toString(),
          createdAt: request.createdAt,
        })),
      });
    } catch (error) {
      console.error(
        "Contact requests fetch error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Unable to fetch contact requests.",
      });
    }
  }
);

// ===============================
// UPDATE CONTACT REQUEST STATUS — OWNER ONLY
// ===============================

app.patch(
  "/api/contact-requests/:requestId/status",
  authMiddleware,
  async (req, res) => {
    try {
      const allowedStatuses = ["Pending", "Reviewed", "Resolved"];
      const { status } = req.body;

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Pending, Reviewed, or Resolved.",
        });
      }

      const contactRequest = await ContactRequest.findById(
        req.params.requestId
      );

      if (!contactRequest) {
        return res.status(404).json({
          success: false,
          message: "Contact request not found.",
        });
      }

      // Verify that the signed-in user owns the item.
      const identity = await Identity.findOne({
        _id: contactRequest.identity,
        ownerId: req.user.id,
      }).select("_id");

      if (!identity) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this request.",
        });
      }

      contactRequest.status = status;
      await contactRequest.save();

      return res.json({
        success: true,
        message: "Contact request status updated successfully.",
        request: {
          id: contactRequest._id.toString(),
          safeReturnId: contactRequest.safeReturnId,
          status: contactRequest.status,
        },
      });
    } catch (error) {
      console.error(
        "Update contact request status error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Unable to update contact request status.",
      });
    }
  }
);

// ==========================================
// GET CONTACT REQUEST STATUS — FINDER
// ==========================================

app.get("/api/contact-request-status/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID.",
      });
    }

    const request = await ContactRequest.findById(requestId)
      .select("status safeReturnId createdAt")
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Contact request not found.",
      });
    }

    return res.json({
      success: true,
      request: {
        requestId: request._id.toString(),
        safeReturnId: request.safeReturnId,
        status: request.status || "Pending",
        createdAt: request.createdAt,
      },
    });
  } catch (error) {
    console.error("Finder status fetch error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch request status.",
    });
  }
});

// ==========================================
// GET OWNER NOTIFICATIONS
// ==========================================

app.get(
  "/api/notifications",
  authMiddleware,
  async (req, res) => {
    try {
      // Find items owned by the logged-in user
      const identities = await Identity.find({
        ownerId: req.user.id,
      })
        .select("_id safeReturnId itemName")
        .lean();

      const identityIds = identities.map((item) => item._id);

      // Get contact requests for those items
      const requests = await ContactRequest.find({
        identity: { $in: identityIds },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("safeReturnId finderName status createdAt identity")
        .lean();

      const notifications = requests.map((request) => {
        const item = identities.find(
          (item) => item._id.toString() === request.identity.toString()
        );

        return {
          id: request._id.toString(),
          safeReturnId: request.safeReturnId,
          itemName: item?.itemName || "Registered item",
          finderName: request.finderName || "Someone",
          status: request.status || "Pending",
          createdAt: request.createdAt,
          message: `New contact request for ${item?.itemName || request.safeReturnId}`,
        };
      });

      return res.json({
        success: true,
        unreadCount: notifications.filter(
          (notification) => notification.status === "Pending"
        ).length,
        notifications,
      });
    } catch (error) {
      console.error("Notifications fetch error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to fetch notifications.",
      });
    }
  }
);

// ==========================================
// DELETE SINGLE CONTACT REQUEST — OWNER ONLY
// ==========================================

app.delete(
  "/api/contact-requests/:requestId",
  authMiddleware,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contact request ID.",
        });
      }

      const request = await ContactRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Contact request not found.",
        });
      }

      // Verify the signed-in user owns the item linked to this request.
      const identity = await Identity.findOne({
        _id: request.identity,
        ownerId: req.user.id,
      }).select("_id");

      if (!identity) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this request.",
        });
      }

      await ContactRequest.deleteOne({ _id: request._id });

      return res.json({
        success: true,
        message: "Contact request deleted successfully.",
        requestId: request._id.toString(),
      });
    } catch (error) {
      console.error("Delete contact request error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete contact request.",
      });
    }
  }
);

// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SafeReturn backend is running",
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((error, req, res, next) => {
  console.error("Unhandled server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(400).json({
    success: false,
    message: error.message || "Server error",
  });
});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {
  console.log(
    `SafeReturn backend running on http://localhost:${PORT}`
  );
});