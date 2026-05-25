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
} from "lucide-react";
import {
  getStudentProfile,
  updateStudentProfile,
  getS3UploadUrl,
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

  // Load the existing avatar via the secure download proxy
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
      // Step 1: Get presigned upload URL from backend
      const urlResult = await getS3UploadUrl(file.name, "avatar");
      if ("error" in urlResult) throw new Error(urlResult.error as string);
      const { upload_url, file_key } = urlResult;

      // Step 2: PUT the binary file directly to S3
      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!putRes.ok) throw new Error("Upload to S3 failed");

      // Step 3: Preview via data: URL (CSP allows data:, not blob:)
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
        {/* Avatar circle */}
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

        {/* Hover overlay */}
        {!uploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-yellow-400" />
          </div>
        )}

        {/* Upload ring animation */}
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
  const [newAvatarKey, setNewAvatarKey] = useState<string | undefined>(
    undefined
  );
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [bio, setBio] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getStudentProfile().then((result) => {
      if ("error" in result) {
        setLoadError(result.error as string);
      } else {
        setProfile(result);
        setLinkedin(result.linkedin_url || "");
        setGithub(result.github_url || "");
        setBio(result.bio || "");
        setNewAvatarKey(result.avatar_s3_key);
      }
    });
  }, []);

  function handleSave() {
    setSaveSuccess(false);
    setSaveError(null);

    startTransition(async () => {
      const result = await updateStudentProfile({
        avatar_s3_key: newAvatarKey ?? null,
        linkedin_url: linkedin || null,
        github_url: github || null,
        bio: bio || null,
      });

      if ("error" in result) {
        setSaveError(result.error as string);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
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
    ? `${profile.first_name} ${profile.last_name}`
    : "Loading...";

  return (
    <div className="space-y-8 max-w-3xl">
      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Personalize your identity across the Kybern LMS
          </p>
        </div>
      </div>

      {/* ── Avatar & Identity Card ── */}
      <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-foreground pointer-events-none">
          <User className="w-48 h-48 -mr-8 -mt-8" />
        </div>

        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">
            Identity
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Avatar upload */}
            <AvatarUploader
              currentKey={profile?.avatar_s3_key}
              name={fullName}
              onUploadComplete={(key) => setNewAvatarKey(key)}
            />

            {/* Name / Email display */}
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  {fullName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {profile?.email || ""}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                  Active Student
                </span>
              </div>

              <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-sm">
                Your profile picture will appear on your alumni portfolio page
                once you graduate and in the Break-It Labs leaderboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Professional Links Card ── */}
      <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">
            Professional Links
          </p>
          <p className="text-xs text-muted-foreground/60">
            Used to auto-fill your graduation approval form.
          </p>
        </div>

        {/* LinkedIn */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Linkedin className="w-3.5 h-3.5 text-sky-500" />
            LinkedIn Profile URL
          </label>
          <input
            id="settings-linkedin"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/your-profile"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all"
          />
        </div>

        {/* GitHub */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <Github className="w-3.5 h-3.5" />
            GitHub Profile URL
          </label>
          <input
            id="settings-github"
            type="url"
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            placeholder="https://github.com/your-handle"
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all"
          />
        </div>
      </div>

      {/* ── Bio Card ── */}
      <div className="bg-card border border-border rounded-3xl p-8 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <FileText className="w-3.5 h-3.5 text-yellow-500" />
            Short Bio
          </label>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            A brief summary of your background. Shown on your alumni page.
          </p>
        </div>
        <textarea
          id="settings-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="e.g. Cloud Native engineer passionate about infrastructure automation and open source…"
          className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all resize-none"
        />
        <p className="text-[10px] text-muted-foreground/40 text-right">
          {bio.length} / 500
        </p>
      </div>

      {/* ── Save Bar ── */}
      <div className="flex items-center justify-between gap-4 p-4 bg-card/50 border border-border rounded-2xl">
        <div className="flex items-center gap-3 min-h-[20px]">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              Profile saved successfully
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {saveError}
            </div>
          )}
        </div>

        <button
          id="settings-save-btn"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2.5 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-95"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
