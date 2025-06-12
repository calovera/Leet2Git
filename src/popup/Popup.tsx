import React, { useState, useEffect } from "react";

interface Stats {
  streak: number;
  counts: { easy: number; medium: number; hard: number };
  recentSolves: Array<{
    id: string;
    title: string;
    language: string;
    difficulty: string;
    timestamp: number;
  }>;
}

interface PendingItem {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  slug: string;
  code: string;
  timestamp: number;
  description?: string;
  submissionId: string;
  tag?: string;
  folderPath?: string;
}

// Helper function to get file extension based on language
const getFileExtension = (language: string): string => {
  const extensions: { [key: string]: string } = {
    javascript: "js",
    python: "py",
    python3: "py",
    java: "java",
    "c++": "cpp",
    cpp: "cpp",
    c: "c",
    "c#": "cs",
    csharp: "cs",
    ruby: "rb",
    swift: "swift",
    go: "go",
    golang: "go",
    scala: "scala",
    kotlin: "kt",
    rust: "rs",
    php: "php",
    typescript: "ts",
    mysql: "sql",
    postgresql: "sql",
  };
  
  const normalizedLang = (language || "").toLowerCase().trim();
  return extensions[normalizedLang] || "py";
};

interface GitHubAuth {
  token: string;
  username: string;
  email: string;
  connected: boolean;
}

interface RepoCfg {
  owner: string;
  repo: string;
  branch: string;
  private: boolean;
  folderStructure: "difficulty" | "topic" | "flat";
  includeDescription: boolean;
  includeTestCases: boolean;
}

interface HomeData {
  stats: Stats;
  pending: PendingItem[];
  auth: GitHubAuth | null;
  config: RepoCfg;
}

const HomeSection = ({ stats }: { stats: Stats }) => {
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      Python: "#3776ab",
      JavaScript: "#f7df1e",
      Java: "#ed8b00",
      "C++": "#00599c",
      Go: "#00add8",
      Rust: "#ce422b",
    };
    return colors[language] || "#6b7280";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: "4px",
            }}
          >
            {stats.streak}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
            Day Streak
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: "4px",
            }}
          >
            {stats.counts.easy + stats.counts.medium + stats.counts.hard}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}>
            Total Solved
          </div>
        </div>
      </div>

      {/* Difficulty Cards */}
      <div style={{ display: "flex", gap: "8px" }}>
        {[
          { label: "Easy", count: stats.counts.easy, color: "#10b981" },
          { label: "Medium", count: stats.counts.medium, color: "#f59e0b" },
          { label: "Hard", count: stats.counts.hard, color: "#ef4444" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(12px)",
              borderRadius: "10px",
              padding: "12px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: color,
                marginBottom: "2px",
              }}
            >
              {count}
            </div>
            <div
              style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)" }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Solves */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "12px",
          }}
        >
          Recent Solves
        </div>
        {stats.recentSolves.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "13px",
            }}
          >
            <div style={{ marginBottom: "8px", fontSize: "20px" }}>🎯</div>
            <div>No recent solutions yet</div>
            <div>Start solving problems on LeetCode!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {stats.recentSolves.slice(0, 3).map((solve, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#ffffff",
                    }}
                  >
                    {solve.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background:
                          solve.difficulty === "Easy"
                            ? "#10b981"
                            : solve.difficulty === "Medium"
                            ? "#f59e0b"
                            : "#ef4444",
                        color: "#ffffff",
                        fontWeight: "500",
                      }}
                    >
                      {solve.difficulty}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "rgba(255, 255, 255, 0.7)",
                        background: `${getLanguageColor(solve.language)}20`,
                        padding: "1px 4px",
                        borderRadius: "3px",
                      }}
                    >
                      {solve.language}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(255, 255, 255, 0.5)",
                  }}
                >
                  {formatTimeAgo(solve.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const PushSection = ({
  pending,
  auth,
  setHomeData,
  fetchData,
}: {
  pending: PendingItem[];
  auth: GitHubAuth | null;
  setHomeData: React.Dispatch<React.SetStateAction<HomeData>>;
  fetchData: () => void;
}) => {
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [solutionSettings, setSolutionSettings] = useState<{[key: string]: {difficulty: string, folderPath: string}}>({});

  const toggleCodePreview = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleDeleteSubmission = async (itemId: string) => {
    try {
      // Get current pending solutions and remove the selected one
      const updatedPending = pending.filter(
        (item) => (item.id || `${pending.indexOf(item)}`) !== itemId
      );

      // Update storage
      await chrome.storage.sync.set({ pending: updatedPending });

      // Update badge count immediately
      chrome.runtime.sendMessage({ type: 'updateBadge' });

      // Refresh data to update UI
      fetchData();
    } catch (error) {
      console.error("Error deleting submission:", error);
    }
  };

  const updateSolutionSetting = async (itemId: string, field: 'difficulty' | 'folderPath', value: string) => {
    const updatedSettings = {
      ...solutionSettings,
      [itemId]: {
        ...solutionSettings[itemId],
        [field]: value
      }
    };
    setSolutionSettings(updatedSettings);

    // Update the actual pending solution
    const updatedPending = pending.map(item => {
      const id = item.id || `${pending.indexOf(item)}`;
      if (id === itemId) {
        return { ...item, [field]: value };
      }
      return item;
    });

    // Save to storage
    await chrome.storage.sync.set({ pending: updatedPending });
  };

  const getSolutionSetting = (itemId: string, field: 'difficulty' | 'folderPath', defaultValue: string) => {
    return solutionSettings[itemId]?.[field] || defaultValue;
  };

  const handleSync = async () => {
    if (!auth || !auth.connected) {
      setPushStatus("Please connect to GitHub first in Settings tab");
      setTimeout(() => setPushStatus(""), 3000);
      return;
    }

    // Validate that all solutions have difficulty selected
    const hasInvalidSolutions = pending.some(item => {
      const itemId = item.id || `${pending.indexOf(item)}`;
      const difficulty = getSolutionSetting(itemId, 'difficulty', item.difficulty || 'Level');
      return difficulty === 'Level';
    });

    if (hasInvalidSolutions) {
      setPushStatus("Please select difficulty for all solutions before pushing");
      setTimeout(() => setPushStatus(""), 3000);
      return;
    }

    setIsPushing(true);
    setPushStatus("Syncing solutions to GitHub...");

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage({ type: "push" }, resolve);
      });

      if (response.success) {
        setPushStatus(`Successfully synced ${response.count || 0} solutions!`);
        // Update stats for solutions with valid difficulties
        pending.forEach(async (item) => {
          const itemId = item.id || `${pending.indexOf(item)}`;
          const difficulty = getSolutionSetting(itemId, 'difficulty', item.difficulty || 'Level');
          if (difficulty !== 'Level') {
            // Update difficulty counter in stats
            const { stats = { streak: 0, counts: { easy: 0, medium: 0, hard: 0 }, recentSolves: [] } } = await chrome.storage.sync.get('stats');
            const difficultyKey = difficulty.toLowerCase();
            if (stats.counts[difficultyKey] !== undefined) {
              stats.counts[difficultyKey]++;
              await chrome.storage.sync.set({ stats });
            }
          }
        });
        fetchData();
      } else {
        setPushStatus(`Error: ${response.error || "Unknown error occurred"}`);
      }
    } catch (error) {
      setPushStatus("Error: Failed to sync solutions");
    }

    setIsPushing(false);
    setTimeout(() => setPushStatus(""), 3000);
  };

  const isDisabled = isPushing || !auth?.connected;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={isDisabled}
        style={{
          background: isDisabled
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(139, 92, 246, 0.9)",
          color: isDisabled ? "rgba(255, 255, 255, 0.5)" : "#ffffff",
          border: "none",
          borderRadius: "12px",
          padding: "16px 24px",
          fontSize: "14px",
          fontWeight: "600",
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.2s ease",
          opacity: isDisabled ? 0.6 : 1,
          backdropFilter: "blur(12px)",
          boxShadow: isDisabled ? "none" : "0 4px 16px rgba(139, 92, 246, 0.3)",
        }}
      >
        {isPushing
          ? "Syncing..."
          : !auth?.connected
          ? "Connect GitHub First"
          : "Sync to GitHub"}
      </button>

      {/* Status Message */}
      {pushStatus && (
        <div
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
            borderRadius: "8px",
            padding: "12px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: "13px",
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          {pushStatus}
        </div>
      )}

      {/* Pending Solutions */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "12px",
          }}
        >
          Pending Solutions ({pending.length})
        </div>

        {pending.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "13px",
            }}
          >
            <div style={{ marginBottom: "8px", fontSize: "20px" }}>✨</div>
            <div>All caught up!</div>
            <div>No pending solutions to sync</div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {pending.map((item, index) => (
              <div
                key={item.id || index}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#ffffff",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <select
                        value={getSolutionSetting(item.id || `${index}`, 'difficulty', item.difficulty || 'Level')}
                        onChange={(e) => updateSolutionSetting(item.id || `${index}`, 'difficulty', e.target.value)}
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: getSolutionSetting(item.id || `${index}`, 'difficulty', item.difficulty || 'Level') === 'Level' 
                            ? "#6b7280" 
                            : getSolutionSetting(item.id || `${index}`, 'difficulty', item.difficulty || 'Level') === "Easy"
                              ? "#10b981"
                              : getSolutionSetting(item.id || `${index}`, 'difficulty', item.difficulty || 'Level') === "Medium"
                              ? "#f59e0b"
                              : "#ef4444",
                          color: "#ffffff",
                          fontWeight: "500",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="Level" style={{color: "#000"}}>Level</option>
                        <option value="Easy" style={{color: "#000"}}>Easy</option>
                        <option value="Medium" style={{color: "#000"}}>Medium</option>
                        <option value="Hard" style={{color: "#000"}}>Hard</option>
                      </select>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "rgba(255, 255, 255, 0.7)",
                          background: `rgba(139, 92, 246, 0.2)`,
                          padding: "1px 4px",
                          borderRadius: "3px",
                        }}
                      >
                        {item.language}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>📁</span>
                      <input
                        type="text"
                        value={getSolutionSetting(item.id || `${index}`, 'folderPath', item.folderPath || 'Problems')}
                        onChange={(e) => updateSolutionSetting(item.id || `${index}`, 'folderPath', e.target.value)}
                        placeholder="Folder path"
                        style={{
                          fontSize: "10px",
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "3px",
                          padding: "2px 4px",
                          color: "#ffffff",
                          flex: 1,
                        }}
                      />
                      <span style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.5)" }}>
                        /{item.title.replace(/[^a-zA-Z0-9]/g, '')}.{getFileExtension(item.language)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => toggleCodePreview(item.id || `${index}`)}
                      style={{
                        background: "rgba(139, 92, 246, 0.3)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                    >
                      {expandedItems.has(item.id || `${index}`)
                        ? "Hide"
                        : "Code"}
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteSubmission(item.id || `${index}`)
                      }
                      style={{
                        background: "rgba(239, 68, 68, 0.3)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "10px",
                        cursor: "pointer",
                      }}
                      title="Delete this submission"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {expandedItems.has(item.id || `${index}`) && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      background: "rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    <pre
                      style={{
                        fontSize: "10px",
                        color: "rgba(255, 255, 255, 0.8)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        margin: "0",
                        maxHeight: "150px",
                        overflowY: "auto",
                      }}
                    >
                      {item.code}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsSection = ({
  auth,
  config,
  setHomeData,
}: {
  auth: GitHubAuth | null;
  config: RepoCfg;
  setHomeData: React.Dispatch<React.SetStateAction<HomeData>>;
}) => {
  const [token, setToken] = useState("");
  const [repoOwner, setRepoOwner] = useState(config?.owner || "");
  const [repoName, setRepoName] = useState(
    config?.repo || "leetcode-solutions"
  );
  const [branch, setBranch] = useState(config?.branch || "main");
  const [isPrivate, setIsPrivate] = useState<boolean>(config?.private || false);
  const [folderStructure, setFolderStructure] = useState<
    "difficulty" | "topic" | "flat"
  >(config?.folderStructure || "topic");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setVerifyStatus("Please enter a GitHub token");
      return;
    }

    setIsVerifying(true);
    setVerifyStatus("Verifying token...");

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "auth",
            data: { token: token.trim() },
          },
          resolve
        );
      });

      if (response.success) {
        setVerifyStatus(`✓ Connected as ${response.username}`);
        // Update the local homeData state immediately
        setHomeData((prev) => ({
          ...prev,
          auth: response.auth,
        }));
        setTimeout(() => setVerifyStatus(""), 3000);
      } else {
        setVerifyStatus(`✗ ${response.error || "Invalid token"}`);
      }
    } catch (error) {
      setVerifyStatus("✗ Failed to verify token");
    }

    setIsVerifying(false);
  };

  const handleSaveConfig = async () => {
    const newConfig = {
      owner: repoOwner.trim(),
      repo: repoName.trim(),
      branch: branch.trim(),
      private: isPrivate,
      folderStructure: folderStructure,
      includeDescription: true,
      includeTestCases: false,
    };

    if (!newConfig.owner || !newConfig.repo) {
      setSaveStatus("✗ Repository owner and name are required");
      return;
    }

    setIsSaving(true);
    setSaveStatus("Saving configuration...");

    try {
      const response = await new Promise<any>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "updateConfig",
            payload: newConfig,
          },
          resolve
        );
      });

      if (response.success) {
        setSaveStatus("✓ Configuration saved successfully");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus(`✗ ${response.error || "Failed to save configuration"}`);
      }
    } catch (error) {
      setSaveStatus("✗ Failed to save configuration");
    }

    setIsSaving(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* GitHub Authentication */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "12px",
          }}
        >
          GitHub Authentication
        </div>
        {auth?.connected ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              borderRadius: "8px",
              border: "1px solid rgba(16, 185, 129, 0.25)",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#10b981",
              }}
            />
            <div style={{ color: "#ffffff", fontSize: "13px" }}>
              Connected as <strong>{auth.username}</strong>
            </div>
            <button
              onClick={async () => {
                await chrome.storage.sync.remove([
                  "github_token",
                  "github_user",
                  "auth",
                ]);
                setHomeData((prev) => ({
                  ...prev,
                  auth: null,
                }));
              }}
              style={{
                marginLeft: "auto",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              }}
            >
              Remove Token
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}
              >
                GitHub Personal Access Token:
              </span>
              <span style={{ position: "relative", display: "inline-block" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#a5b4fc",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textAlign: "center",
                    lineHeight: "16px",
                    cursor: "pointer",
                  }}
                  tabIndex={0}
                >
                  i
                </span>
                <span
                  style={{
                    visibility: "hidden",
                    opacity: 0,
                    maxWidth: "260px",
                    width: "max-content",
                    background: "#312e81",
                    color: "#fff",
                    textAlign: "left",
                    borderRadius: "8px",
                    padding: "10px",
                    position: "absolute",
                    zIndex: 10,
                    left: "50%",
                    top: "125%",
                    transform: "translateX(-50%)",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    transition: "opacity 0.2s",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                  className="token-permission-tooltip"
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "7px solid transparent",
                      borderRight: "7px solid transparent",
                      borderBottom: "7px solid #312e81",
                    }}
                  />
                  <strong>Required GitHub Token Permissions:</strong>
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    <li>repo (full control of private repositories)</li>
                    <li>user (read your user profile)</li>
                  </ul>
                  <div style={{ marginTop: "6px" }}>
                    To push code, create repositories, and sync your LeetCode
                    solutions.
                  </div>
                </span>
                <style>{`
                  .token-permission-tooltip {
                    pointer-events: none;
                  }
                  span[tabindex="0"]:hover + .token-permission-tooltip,
                  span[tabindex="0"]:focus + .token-permission-tooltip {
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                `}</style>
              </span>
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your GitHub token"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,user&description=Leet2Git"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#a5b4fc",
                fontSize: "12px",
                textDecoration: "underline",
                marginBottom: "4px",
              }}
            >
              Generate a GitHub Access Token
            </a>
            <button
              onClick={handleVerifyToken}
              disabled={isVerifying}
              style={{
                background: "rgba(139, 92, 246, 0.9)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: "500",
                cursor: isVerifying ? "not-allowed" : "pointer",
                opacity: isVerifying ? 0.7 : 1,
              }}
            >
              {isVerifying ? "Verifying..." : "Verify Token"}
            </button>
            {verifyStatus && (
              <div
                style={{
                  fontSize: "11px",
                  color: verifyStatus.includes("✓") ? "#10b981" : "#ef4444",
                  textAlign: "center",
                }}
              >
                {verifyStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repository Configuration */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "12px",
          }}
        >
          Repository Configuration
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "4px",
              }}
            >
              Repository Owner:
            </div>
            <input
              type="text"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              placeholder="GitHub username or organization"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "4px",
              }}
            >
              Repository Name:
            </div>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="leetcode-solutions"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "4px",
              }}
            >
              Branch:
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              id="private-repo"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: "14px", height: "14px" }}
            />
            <label
              htmlFor="private-repo"
              style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}
            >
              Private Repository
            </label>
          </div>



          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            style={{
              background: "rgba(139, 92, 246, 0.9)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 20px",
              fontSize: "12px",
              fontWeight: "500",
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
              marginTop: "4px",
            }}
          >
            {isSaving ? "Saving..." : "Save Configuration"}
          </button>

          {saveStatus && (
            <div
              style={{
                fontSize: "11px",
                color: saveStatus.includes("✓") ? "#10b981" : "#ef4444",
                textAlign: "center",
              }}
            >
              {saveStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"home" | "push" | "settings">(
    "home"
  );
  const [homeData, setHomeData] = useState<HomeData>({
    stats: {
      streak: 0,
      counts: { easy: 0, medium: 0, hard: 0 },
      recentSolves: [],
    },
    pending: [],
    auth: null,
    config: {
      owner: "",
      repo: "leetcode-solutions",
      branch: "main",
      private: false,
      folderStructure: "topic" as "topic",
      includeDescription: true,
      includeTestCases: false,
    },
  });
  const fetchData = () => {
    try {
      chrome.runtime.sendMessage({ type: "getHomeData" }, (response) => {
        if (response && response.success && response.data) {
          setHomeData(response.data);
        } else {
          console.error("Failed to fetch home data:", response);
        }
      });
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  return (
    <div
      style={{
        width: "380px",
        minHeight: "500px",
        maxHeight: "600px",
        background:
          "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            🎯
          </div>
          <div>
            <div
              style={{ fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}
            >
              Leet2Git
            </div>
            <div
              style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)" }}
            >
              LeetCode → GitHub Sync
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { key: "home", label: "Home", icon: "🏠" },
            { key: "push", label: "Push", icon: "🚀" },
            { key: "settings", label: "Settings", icon: "⚙️" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as "home" | "push" | "settings")}
              style={{
                flex: 1,
                padding: "8px 6px",
                background:
                  activeTab === key
                    ? "rgba(255, 255, 255, 0.15)"
                    : "transparent",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "12px" }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {activeTab === "home" && homeData && (
          <HomeSection stats={homeData.stats} />
        )}

        {activeTab === "push" && homeData && (
          <PushSection
            pending={homeData.pending}
            auth={homeData.auth}
            setHomeData={setHomeData}
            fetchData={fetchData}
          />
        )}

        {activeTab === "settings" && homeData && (
          <SettingsSection
            auth={homeData.auth}
            config={homeData.config}
            setHomeData={setHomeData}
          />
        )}
      </div>
    </div>
  );
};

export default Popup;
