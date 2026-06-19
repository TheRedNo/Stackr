import { useEffect, useMemo, useState } from "react";
import {
    ChevronDown,
    Home,
    Minus,
    Plus,
    Search,
    Square,
    X,
} from "lucide-react";
import React from "react";

type AppItem = StackrApp;
type ProfileItem = StackrProfile;

function Index() {
    const [apps, setApps] = useState<AppItem[]>([]);
    const [profiles, setProfiles] = useState<ProfileItem[]>([]);
    const [currentProfile, setCurrentProfile] = useState<string>("private");

    const [query, setQuery] = useState("");
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

    const [showAddProfile, setShowAddProfile] = useState(false);
    const [newProfileName, setNewProfileName] = useState("");

    const [profileContextMenu, setProfileContextMenu] = useState<{
        x: number;
        y: number;
        profile: ProfileItem;
    } | null>(null);

    const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);
    const [editProfileName, setEditProfileName] = useState("");

    const [showAdd, setShowAdd] = useState(false);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        app: AppItem;
    } | null>(null);

    const [editingApp, setEditingApp] = useState<AppItem | null>(null);
    const [editName, setEditName] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [editDescription, setEditDescription] = useState("");

    useEffect(() => {
        window.stackr.getApps().then(setApps);
        window.stackr.getProfiles().then(setProfiles);
        window.stackr.getCurrentProfile().then(setCurrentProfile);
    }, []);

    const selectedProfile = profiles.find((p) => p.id === currentProfile);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return apps.filter(
            (a) =>
                !q ||
                a.name.toLowerCase().includes(q) ||
                a.description.toLowerCase().includes(q)
        );
    }, [apps, query]);

    async function selectProfile(id: string) {
        await window.stackr.setCurrentProfile(id);
        setCurrentProfile(id);
        setProfileDropdownOpen(false);
        setProfileContextMenu(null);
    }

    async function addProfile() {
        if (!newProfileName.trim()) return;

        const profile = await window.stackr.addProfile(newProfileName.trim());
        const freshProfiles = await window.stackr.getProfiles();

        setProfiles(freshProfiles);
        await selectProfile(profile.id);

        setNewProfileName("");
        setShowAddProfile(false);
    }

    function openAddProfile() {
        setProfileDropdownOpen(false);
        setProfileContextMenu(null);
        setContextMenu(null);
        setEditingProfile(null);
        setNewProfileName("");
        setShowAddProfile(true);
    }

    function openProfileEdit(profile: ProfileItem) {
        setProfileContextMenu(null);
        setContextMenu(null);
        setProfileDropdownOpen(false);
        setShowAddProfile(false);

        setEditingProfile(profile);
        setEditProfileName(profile.name);
    }

    async function saveProfileEdit() {
        if (!editingProfile) return;
        if (!editProfileName.trim()) return;

        const updated = await window.stackr.updateProfile(
            editingProfile.id,
            editProfileName.trim()
        );

        setProfiles((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
        );

        setEditingProfile(null);
        setEditProfileName("");
    }

    async function deleteProfile(profile: ProfileItem) {
        setProfileContextMenu(null);
        setContextMenu(null);
        setProfileDropdownOpen(false);
        setEditingProfile(null);
        setShowAddProfile(false);

        if (profiles.length <= 1) {
            alert("Das letzte Profil kann nicht gelöscht werden.");
            return;
        }

        const ok = confirm(`Profil "${profile.name}" wirklich löschen?`);
        if (!ok) return;

        await window.stackr.deleteProfile(profile.id);

        const freshProfiles = await window.stackr.getProfiles();
        const freshCurrent = await window.stackr.getCurrentProfile();

        setProfiles(freshProfiles);
        setCurrentProfile(freshCurrent);
    }

    async function addApp() {
        if (!name.trim() || !url.trim()) return;

        const finalUrl = url.startsWith("http") ? url : `https://${url}`;

        const newApp = await window.stackr.addApp({
            name,
            url: finalUrl,
            description,
            category: "Produktivität",
        });

        setApps((prev) => [...prev, newApp]);

        setName("");
        setUrl("");
        setDescription("");
        setShowAdd(false);
    }

    function openEdit(app: AppItem) {
        setEditingApp(app);
        setEditName(app.name);
        setEditUrl(app.url);
        setEditDescription(app.description || "");
        setContextMenu(null);
    }

    async function saveEdit() {
        if (!editingApp) return;

        const updated = await window.stackr.updateApp(editingApp.id, {
            name: editName,
            url: editUrl,
            description: editDescription,
        });

        setApps((prev) =>
            prev.map((app) => (app.id === updated.id ? updated : app))
        );

        setEditingApp(null);
    }

    async function deleteApp(app: AppItem) {
        const ok = confirm(`"${app.name}" wirklich löschen?`);
        if (!ok) return;

        await window.stackr.deleteApp(app.id);

        setApps((prev) => prev.filter((a) => a.id !== app.id));
        setContextMenu(null);
    }

    return (
        <div
            className="min-h-screen"
            onClick={() => {
                setContextMenu(null);
                setProfileContextMenu(null);
                setProfileDropdownOpen(false);
            }}
        >
            <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b bg-background/90 backdrop-blur drag-region">
                <div className="flex items-center gap-2 px-4 no-drag">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setProfileDropdownOpen((prev) => !prev);
                            }}
                            className="flex h-9 min-w-32 items-center justify-between gap-2 rounded-xl border bg-card/70 px-3 text-sm hover:bg-accent"
                        >
                            <span>{selectedProfile?.name || "Profil"}</span>
                            <ChevronDown size={16} />
                        </button>

                        {profileDropdownOpen && (
                            <div
                                className="absolute left-0 top-11 z-50 w-48 overflow-hidden rounded-xl border bg-card shadow-glow no-drag"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {profiles.map((profile) => (
                                    <button
                                        key={profile.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectProfile(profile.id);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();

                                            setProfileContextMenu({
                                                x: e.clientX,
                                                y: e.clientY,
                                                profile,
                                            });
                                        }}
                                        className={`w-full px-4 py-3 text-left text-sm hover:bg-accent ${
                                            profile.id === currentProfile ? "bg-accent" : ""
                                        }`}
                                    >
                                        {profile.name}
                                    </button>
                                ))}

                                <div className="border-t" />

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openAddProfile();
                                    }}
                                    className="w-full px-4 py-3 text-left text-sm text-primary hover:bg-accent"
                                >
                                    + Add profile
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => window.stackr.goHome()}
                        className="grid h-9 w-9 place-items-center rounded-xl hover:bg-accent"
                        title="Home"
                    >
                        <Home size={18} />
                    </button>
                </div>

                <div className="flex-1 text-center text-sm font-medium text-muted-foreground">
                    Stackr
                </div>

                <div className="flex items-center no-drag">
                    <button
                        onClick={() => window.stackr.minimize()}
                        className="grid h-14 w-12 place-items-center hover:bg-accent"
                        title="Minimieren"
                    >
                        <Minus size={16} />
                    </button>

                    <button
                        onClick={() => window.stackr.maximize()}
                        className="grid h-14 w-12 place-items-center hover:bg-accent"
                        title="Maximieren"
                    >
                        <Square size={14} />
                    </button>

                    <button
                        onClick={() => window.stackr.close()}
                        className="grid h-14 w-12 place-items-center hover:bg-red-500 hover:text-white"
                        title="Schließen"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-6 pb-12 pt-28 sm:pb-16">
                <section>
                    <div className="flex items-center gap-3 rounded-2xl border bg-card/60 px-4 py-3 shadow-tile backdrop-blur">
                        <Search className="h-4 w-4 text-muted-foreground" size={16} />
                        <input
                            value={query}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search for an app…"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>
                </section>

                <section className="mt-10 grid grid-cols-4 justify-items-center gap-x-4 gap-y-6 sm:grid-cols-6 lg:grid-cols-8">
                    {filtered.map((app) => (
                        <button
                            key={app.id}
                            type="button"
                            title={app.description}
                            onClick={() => window.stackr.openUrl(app.url)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    app,
                                });
                            }}
                            className="group flex flex-col items-center gap-2 focus:outline-none"
                        >
                            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-card font-display text-2xl font-bold text-white shadow-tile transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
                                {app.iconDataUrl ? (
                                    <img
                                        src={app.iconDataUrl}
                                        alt={app.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    app.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <span className="line-clamp-1 text-center text-xs font-medium text-foreground/90">
                                {app.name}
                            </span>
                        </button>
                    ))}

                    <button
                        onClick={() => setShowAdd(true)}
                        className="group flex flex-col items-center gap-2 focus:outline-none"
                    >
                        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed bg-card/60 text-muted-foreground shadow-tile transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-glow">
                            <Plus size={30} />
                        </div>

                        <span className="line-clamp-1 text-center text-xs font-medium text-foreground/90">
                            Add App
                        </span>
                    </button>

                    {apps.length > 0 && filtered.length === 0 && (
                        <div className="col-span-full rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground pr-4 pl-4">
                            No app found for „{query}"
                        </div>
                    )}
                </section>

                <footer className="mt-20 border-t pt-6 text-center text-xs text-muted-foreground">
                    {filtered.length} von {apps.length} Apps • Profil:{" "}
                    {selectedProfile?.name || currentProfile}
                </footer>
            </div>

            {showAddProfile && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 no-drag"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-glow">
                        <h2 className="text-xl font-semibold">Profil hinzufügen</h2>

                        <div className="mt-5">
                            <input
                                value={newProfileName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Profile name, e.g., Customer A"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                                autoFocus
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowAddProfile(false);
                                    setNewProfileName("");
                                }}
                                className="rounded-xl border px-4 py-2 text-sm hover:bg-accent"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={addProfile}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {profileContextMenu && (
                <div
                    className="fixed z-50 w-44 overflow-hidden rounded-xl border bg-card shadow-glow no-drag"
                    style={{
                        left: profileContextMenu.x,
                        top: profileContextMenu.y,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => openProfileEdit(profileContextMenu.profile)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent"
                    >
                        Rename
                    </button>

                    <button
                        onClick={() => deleteProfile(profileContextMenu.profile)}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-accent"
                    >
                        Delete
                    </button>
                </div>
            )}

            {editingProfile && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 no-drag"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-glow">
                        <h2 className="text-xl font-semibold">Rename profile</h2>

                        <div className="mt-5">
                            <input
                                value={editProfileName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setEditProfileName(e.target.value)}
                                placeholder="Profile name"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                                autoFocus
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setEditingProfile(null);
                                    setEditProfileName("");
                                }}
                                className="rounded-xl border px-4 py-2 text-sm hover:bg-accent"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveProfileEdit}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 no-drag">
                    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-glow">
                        <h2 className="text-xl font-semibold">Add App</h2>

                        <div className="mt-5 space-y-4">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                            />

                            <input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="URL"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                            />

                            <input
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description optional"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setShowAdd(false)}
                                className="rounded-xl border px-4 py-2 text-sm hover:bg-accent"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={addApp}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {contextMenu && (
                <div
                    className="fixed z-50 w-40 overflow-hidden rounded-xl border bg-card shadow-glow"
                    style={{
                        left: contextMenu.x,
                        top: contextMenu.y,
                    }}
                >
                    <button
                        onClick={() => openEdit(contextMenu.app)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent"
                    >
                        Edit
                    </button>

                    <button
                        onClick={async () => {
                            await window.stackr.createDesktopShortcut(contextMenu.app.id);
                            setContextMenu(null);
                        }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-accent"
                    >
                        Create Desktop Shortcut
                    </button>

                    <button
                        onClick={() => deleteApp(contextMenu.app)}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-accent"
                    >
                        Delete
                    </button>
                </div>
            )}

            {editingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 no-drag">
                    <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-glow">
                        <h2 className="text-xl font-semibold">Edit App</h2>

                        <div className="mt-5 space-y-4">
                            <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Name"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                            />

                            <input
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                placeholder="URL"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                            />

                            <input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Description optional"
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => setEditingApp(null)}
                                className="rounded-xl border px-4 py-2 text-sm hover:bg-accent"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveEdit}
                                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Index;