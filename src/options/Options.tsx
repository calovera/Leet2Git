import React, { useState, useEffect } from "react";

interface OptionsState {
  token: string;
  username: string;
  email: string;
  connected: boolean;
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  folderStructure: "difficulty" | "topic" | "flat";
  loading: boolean;
  message: string;
  messageType: "success" | "error" | "";
}

export default function Options() {
  const [state, setState] = useState<OptionsState>({
    token: "",
    username: "",
    email: "",
    connected: false,
    owner: "",
    repo: "leetcode-solutions",
    branch: "main",
    private: false,
    folderStructure: "topic",
    loading: false,
    message: "",
    messageType: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get([
        "github_token",
        "github_user",
        "auth",
        "config",
        "owner",
        "repo",
        "branch",
      ]);

      if (result.github_token && result.github_user) {
        setState((prev) => ({
          ...prev,
          token: result.github_token,
          username: result.github_user.username || "",
          email: result.github_user.email || "",
          connected: result.github_user.connected || false,
        }));
      } else if (result.auth) {
        setState((prev) => ({
          ...prev,
          token: result.auth.token || "",
          username: result.auth.username || "",
          email: result.auth.email || "",
          connected: result.auth.connected || false,
        }));
      }

      if (result.config) {
        setState((prev) => ({
          ...prev,
          owner: result.config.owner || "",
          repo: result.config.repo || "leetcode-solutions",
          branch: result.config.branch || "main",
          private: result.config.private || false,
          folderStructure: result.config.folderStructure || "topic",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          owner: result.owner || "",
          repo: result.repo || "leetcode-solutions",
          branch: result.branch || "main",
        }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const verifyToken = async () => {
    if (!state.token) {
      showStatus("Please enter a GitHub token", false);
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${state.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      const data = await response.json();

      if (data.login) {
        const auth = {
          token: state.token,
          username: data.login,
          email: data.email || "",
          connected: true,
        };

        setState((prev) => ({
          ...prev,
          username: data.login,
          email: data.email || "",
          connected: true,
          owner: prev.owner || data.login,
        }));

        await chrome.storage.sync.set({
          auth,
          github_token: state.token,
          github_user: auth,
        });
        showStatus("GitHub connected successfully!", true);
      } else {
        showStatus("Invalid GitHub token", false);
      }
    } catch (error) {
      showStatus("Error verifying token", false);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const saveSettings = async () => {
    try {
      const config = {
        owner: state.owner,
        repo: state.repo,
        branch: state.branch,
        private: state.private,
        folderStructure: state.folderStructure,
        includeDescription: true,
        includeTestCases: false,
      };

      await chrome.storage.sync.set({
        config,
        owner: state.owner,
        repo: state.repo,
        branch: state.branch,
      });

      showStatus("Settings saved successfully!", true);
    } catch (error) {
      showStatus("Error saving settings", false);
    }
  };

  const showStatus = (message: string, success: boolean) => {
    setState((prev) => ({
      ...prev,
      message,
      messageType: success ? "success" : "error",
    }));

    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        message: "",
        messageType: "",
      }));
    }, 3000);
  };

  const handleInputChange = (field: keyof OptionsState, value: any) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1
          style={{
            color: "#ffffff",
            fontSize: "32px",
            fontWeight: "700",
            marginBottom: "40px",
            textAlign: "center",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
        >
          Leet2Git Settings
        </h1>

        {/* GitHub Authentication */}
        <div
          style={{
            marginBottom: "30px",
            padding: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            GitHub Authentication
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              GitHub Personal Access Token:
            </label>
            <input
              type="password"
              value={state.token}
              onChange={(e) => handleInputChange("token", e.target.value)}
              placeholder="Enter your GitHub token"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </div>

          <button
            onClick={verifyToken}
            disabled={state.loading || !state.token}
            style={{
              padding: "12px 24px",
              backgroundColor: state.connected ? "#10b981" : "#3b82f6",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: state.loading || !state.token ? "not-allowed" : "pointer",
              opacity: state.loading || !state.token ? 0.6 : 1,
              transition: "all 0.2s",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            {state.loading
              ? "Verifying..."
              : state.connected
              ? "Connected"
              : "Verify Token"}
          </button>

          {state.connected && (
            <div
              style={{
                marginTop: "16px",
                color: "#10b981",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              ✓ Connected as {state.username}
            </div>
          )}
        </div>

        {/* Repository Configuration */}
        <div
          style={{
            marginBottom: "30px",
            padding: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "20px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            Repository Configuration
          </h2>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Repository Owner:
            </label>
            <input
              type="text"
              value={state.owner}
              onChange={(e) => handleInputChange("owner", e.target.value)}
              placeholder="GitHub username or organization"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Repository Name:
            </label>
            <input
              type="text"
              value={state.repo}
              onChange={(e) => handleInputChange("repo", e.target.value)}
              placeholder="Repository name"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Branch:
            </label>
            <input
              type="text"
              value={state.branch}
              onChange={(e) => handleInputChange("branch", e.target.value)}
              placeholder="main"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <input
                type="checkbox"
                checked={state.private}
                onChange={(e) => handleInputChange("private", e.target.checked)}
                style={{
                  marginRight: "12px",
                  width: "16px",
                  height: "16px",
                  accentColor: "#3b82f6",
                }}
              />
              Private Repository
            </label>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Folder Structure:
            </label>
            <select
              value={state.folderStructure}
              onChange={(e) =>
                handleInputChange("folderStructure", e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#1e293b",
                outline: "none",
              }}
            >
              <option value="topic">By Topic (Array, Hash Table, etc.)</option>
              <option value="difficulty">
                By Difficulty (Easy, Medium, Hard)
              </option>
              <option value="flat">Flat (All in root)</option>
            </select>
          </div>

          <button
            onClick={saveSettings}
            style={{
              padding: "12px 24px",
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            Save Settings
          </button>
        </div>

        {/* Status Message */}
        {state.message && (
          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              backgroundColor:
                state.messageType === "success"
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
              color: state.messageType === "success" ? "#10b981" : "#ef4444",
              border: `1px solid ${
                state.messageType === "success"
                  ? "rgba(16, 185, 129, 0.2)"
                  : "rgba(239, 68, 68, 0.2)"
              }`,
              backdropFilter: "blur(10px)",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {state.message}
          </div>
        )}
      </div>
    </div>
  );
}
