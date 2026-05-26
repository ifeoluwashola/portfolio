"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  User,
  Github,
  Linkedin,
  FileText,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Settings,
  Shield,
  Sliders,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Bell
} from "lucide-react";
import {
  getStudentProfile,
  updateStudentProfile,
  getS3UploadUrl,
  changePassword,
  requestEmailChange,
  updateStudentPreferences
} from "../../actions";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_s3_key?: string;
  linkedin_url?: string;
  github_url?: string;
  bio?: string;
  username?: string;
  display_name?: string;
  preferences?: any;
}

// ── Avatar Component ──────────────────────────────────────────────────────────
function AvatarUploader({
  currentKey,
  name,
  onUploadComplete,
}: {
  currentKey?: string;
  name: string;
  onUploadComplete: (key: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentKey) return;
    fetch(
      `/api/academy/proxy/v1/media/download-url?key=${encodeURIComponent(currentKey)}`,
      { cache: "no-store" }
    )
      .then((r) => r.json())
      .then((d: { download_url: string }) => setAvatarUrl(d.download_url))
      .catch(() => {});
  }, [currentKey]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const urlResult = await getS3UploadUrl(file.name, "avatar");
      if ("error" in urlResult) throw new Error(urlResult.error as string);
      const { upload_url, file_key } = urlResult;

      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload to S3 failed");

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      setAvatarUrl(dataUrl);

      onUploadComplete(file_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className="relative w-28 h-28 rounded-full cursor-pointer group"
        title="Click to upload avatar"
      >
        <div className="relative w-28 h-28 rounded-full border-2 border-yellow-500/30 overflow-hidden bg-yellow-500/10 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.1)] transition-all group-hover:border-yellow-500/70 group-hover:shadow-[0_0_40px_rgba(234,179,8,0.2)]">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          ) : avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <span className="text-2xl font-bold text-yellow-500/70">
              {initials}
            </span>
          )}
        </div>

        {!uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-yellow-400" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-500/50 animate-ping" />
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="text-center">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {uploading ? "Uploading..." : "Click to change photo"}
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          PNG, JPG, WEBP · Max 5MB
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences">("profile");

  // Profile Form State
  const [newAvatarKey, setNewAvatarKey] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [bio, setBio] = useState("");
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  // Security Form State - Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaveSuccess, setPwdSaveSuccess] = useState(false);
  const [pwdSaveError, setPwdSaveError] = useState<string | null>(null);
  const [isPwdPending, startPwdTransition] = useTransition();
  const [showPwd, setShowPwd] = useState(false);

  // Security Form State - Email
  const [newEmail, setNewEmail] = useState("");
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailPending, startEmailTransition] = useTransition();

  // Preferences Form State
  const [prefs, setPrefs] = useState<any>({ notifications: true, auto_save: false, dark_mode_only: false });
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);
  const [prefSaveError, setPrefSaveError] = useState<string | null>(null);
  const [isPrefPending, startPrefTransition] = useTransition();

  useEffect(() => {
    getStudentProfile().then((result) => {
      if ("error" in result) {
        setLoadError(result.error as string);
      } else {
        setProfile(result);
        setUsername(result.username || "");
        setDisplayName(result.display_name || "");
        setLinkedin(result.linkedin_url || "");
        setGithub(result.github_url || "");
        setBio(result.bio || "");
        setNewAvatarKey(result.avatar_s3_key);
        if (result.preferences) {
          setPrefs(result.preferences);
        }
      }
    });
  }, []);

  function handleSaveProfile() {
    setProfileSaveSuccess(false);
    setProfileSaveError(null);

    startProfileTransition(async () => {
      const result = await updateStudentProfile({
        avatar_s3_key: newAvatarKey ?? null,
        linkedin_url: linkedin || null,
        github_url: github || null,
        bio: bio || null,
        username: username || null,
        display_name: displayName || null,
      });

      if ("error" in result) {
        setProfileSaveError(result.error as string);
      } else {
        setProfileSaveSuccess(true);
        setProfile(prev => prev ? { ...prev, username, display_name: displayName, linkedin_url: linkedin, github_url: github, bio, avatar_s3_key: newAvatarKey } : null);
        setTimeout(() => setProfileSaveSuccess(false), 4000);
      }
    });
  }

  function handleSavePassword() {
    setPwdSaveSuccess(false);
    setPwdSaveError(null);
    if (newPassword !== confirmPassword) {
      setPwdSaveError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPwdSaveError("Password must be at least 8 characters");
      return;
    }
    
    startPwdTransition(async () => {
      const formData = new FormData();
      formData.append("current_password", currentPassword);
      formData.append("new_password", newPassword);
      const result = await changePassword(formData);
      if ("error" in result) {
        setPwdSaveError(result.error as string);
      } else {
        setPwdSaveSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Instantly log out and redirect to login
        window.location.href = "/academy/login";
      }
    });
  }

  function handleRequestEmail() {
    setEmailSuccess(null);
    setEmailError(null);
    if (!newEmail) return;

    startEmailTransition(async () => {
      const result = await requestEmailChange(newEmail);
      if ("error" in result) {
        setEmailError(result.error as string);
      } else {
        setEmailSuccess(result.message || "Verification email sent to " + newEmail);
        setNewEmail("");
      }
    });
  }

  function handleSavePreferences() {
    setPrefSaveSuccess(false);
    setPrefSaveError(null);

    startPrefTransition(async () => {
      const result = await updateStudentPreferences(prefs);
      if ("error" in result) {
        setPrefSaveError(result.error as string);
      } else {
        setPrefSaveSuccess(true);
        setTimeout(() => setPrefSaveSuccess(false), 4000);
      }
    });
  }

  if (loadError) {
    return (
      <div className="flex items-center gap-3 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="text-sm">Failed to load profile: {loadError}</span>
      </div>
    );
  }

  const fullName = profile
    ? profile.display_name || `${profile.first_name} ${profile.last_name}`
    : "Loading...";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your identity, security, and preferences
          </p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex space-x-1 bg-card/50 border border-border rounded-xl p-1 w-full max-w-md">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "profile"
              ? "bg-yellow-500 text-slate-900 shadow-md"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4" /> Profile
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "security"
              ? "bg-yellow-500 text-slate-900 shadow-md"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <Shield className="w-4 h-4" /> Security
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "preferences"
              ? "bg-yellow-500 text-slate-900 shadow-md"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <Sliders className="w-4 h-4" /> Preferences
        </button>
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-foreground pointer-events-none">
              <User className="w-48 h-48 -mr-8 -mt-8" />
            </div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <AvatarUploader
                currentKey={profile?.avatar_s3_key}
                name={fullName}
                onUploadComplete={(key) => setNewAvatarKey(key)}
              />
              <div className="flex-1 space-y-6 w-full">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">{fullName}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. jdoe123"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Linkedin className="w-3.5 h-3.5 text-sky-500" /> LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Github className="w-3.5 h-3.5" /> GitHub URL</label>
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><FileText className="w-3.5 h-3.5 text-yellow-500" /> Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="Brief background summary..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all outline-none resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground/40 text-right">{bio.length} / 500</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end items-center gap-4 pt-6 border-t border-border">
              {profileSaveSuccess && <span className="text-emerald-400 text-sm flex items-center gap-1 animate-in fade-in"><CheckCircle2 className="w-4 h-4"/> Saved successfully</span>}
              {profileSaveError && <span className="text-red-400 text-sm flex items-center gap-1 animate-in fade-in"><AlertTriangle className="w-4 h-4"/> {profileSaveError}</span>}
              <button
                onClick={handleSaveProfile}
                disabled={isProfilePending}
                className="flex items-center gap-2.5 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] active:scale-95"
              >
                {isProfilePending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-foreground pointer-events-none">
              <Lock className="w-48 h-48 -mr-8 -mt-8" />
            </div>
            
            <div className="relative z-10 space-y-8">
              {/* Change Password */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Change Password</h2>
                  <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 pr-10 text-sm text-foreground focus:border-yellow-500/50 outline-none"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Password</label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 outline-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleSavePassword}
                    disabled={isPwdPending || !currentPassword || !newPassword}
                    className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-slate-900 font-bold text-sm rounded-xl transition-all"
                  >
                    {isPwdPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Lock className="w-4 h-4"/>} Update Password
                  </button>
                  {pwdSaveSuccess && <span className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Password updated</span>}
                  {pwdSaveError && <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {pwdSaveError}</span>}
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              {/* Change Email */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Email Address</h2>
                  <p className="text-sm text-muted-foreground">Change the email associated with your account.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Email</label>
                    <input
                      type="text"
                      disabled
                      value={profile?.email || ""}
                      className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">New Email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e.g. new@example.com"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-yellow-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handleRequestEmail}
                    disabled={isEmailPending || !newEmail}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-foreground font-bold text-sm rounded-xl transition-all border border-white/10 hover:border-white/20"
                  >
                    {isEmailPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4"/>} Request Change
                  </button>
                  {emailSuccess && <span className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> {emailSuccess}</span>}
                  {emailError && <span className="text-red-400 text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {emailError}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences Tab ── */}
      {activeTab === "preferences" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-foreground pointer-events-none">
              <Sliders className="w-48 h-48 -mr-8 -mt-8" />
            </div>
            
            <div className="relative z-10 space-y-8 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-foreground">Application Preferences</h2>
                <p className="text-sm text-muted-foreground">Customize your experience within the academy.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-500"/> Email Notifications</h3>
                    <p className="text-xs text-muted-foreground">Receive updates on assignments and announcements.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={prefs.notifications ?? true} onChange={(e) => setPrefs({ ...prefs, notifications: e.target.checked })} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Save className="w-4 h-4 text-yellow-500"/> Auto-Save Drafts</h3>
                    <p className="text-xs text-muted-foreground">Automatically save your lab progress every few minutes.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={prefs.auto_save ?? false} onChange={(e) => setPrefs({ ...prefs, auto_save: e.target.checked })} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex justify-start items-center gap-4 pt-6 border-t border-border">
                <button
                  onClick={handleSavePreferences}
                  disabled={isPrefPending}
                  className="flex items-center gap-2.5 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] active:scale-95"
                >
                  {isPrefPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Save Preferences
                </button>
                {prefSaveSuccess && <span className="text-emerald-400 text-sm flex items-center gap-1 animate-in fade-in"><CheckCircle2 className="w-4 h-4"/> Preferences saved</span>}
                {prefSaveError && <span className="text-red-400 text-sm flex items-center gap-1 animate-in fade-in"><AlertTriangle className="w-4 h-4"/> {prefSaveError}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
