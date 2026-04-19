import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../components/firebase/firebase';
import { useAppSelector } from '../../../store';
import { updateProject, addMember, removeMember } from '../../../db/projects/projectRepo';
import { MemberRole } from '../../../enums/MemberRole';
import { Btn } from '../../../components/Btn/Btn';
import { toast } from '../../../components/toast/toast';
import type { Timestamp } from 'firebase/firestore';
import { Timestamp as FsTimestamp } from 'firebase/firestore';
import styles from './Settings.module.css';

const Settings = () => {
  const project = useAppSelector((s) => s.projects.currentProject);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [addEmail, setAddEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
    }
  }, [project?.id]);

  if (!project) {
    return (
      <div className={styles.root}>
        <div className="container">
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" />
          </div>
        </div>
      </div>
    );
  }

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await updateProject(project.id, { name: name.trim(), description: description.trim() });
      toast.success('Progetto aggiornato');
    } catch {
      toast.error('Errore nel salvataggio');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(project.apiKey).then(() => toast.success('API key copiata'));
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim()) return;
    setAddingMember(true);
    try {
      const lookup = httpsCallable<{ email: string }, { uid: string; email: string }>(
        functions,
        'lookupUserByEmail'
      );
      const res = await lookup({ email: addEmail.trim() });
      const { uid, email } = res.data;
      if (project.memberUids.includes(uid)) {
        toast.error('Utente già membro');
        return;
      }
      await addMember(project.id, uid, {
        email,
        role: MemberRole.Member,
        addedAt: FsTimestamp.now() as Timestamp,
      });
      toast.success('Membro aggiunto');
      setAddEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Utente non trovato';
      toast.error('Errore', { subtitle: msg });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (uid === project.ownerId) return;
    try {
      await removeMember(project.id, uid);
      toast.success('Membro rimosso');
    } catch {
      toast.error('Errore nella rimozione');
    }
  };

  const members = Object.entries(project.members);

  return (
    <div className={styles.root}>
      <div className="container" style={{ maxWidth: 680 }}>
        {/* Project info */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Informazioni progetto</div>
          <form onSubmit={handleSaveInfo}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Nome</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Descrizione</label>
              <textarea
                className="form-control"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Btn type="submit" color="primary" loading={savingInfo}>Salva</Btn>
          </form>
        </div>

        {/* API Key */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>API Key</div>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Usa questa chiave nei tuoi progetti esterni per inviare notifiche a cortexCic.
          </p>
          <div className={styles.apiKeyRow}>
            <input
              type="text"
              className={`form-control ${styles.apiKeyInput}`}
              value={project.apiKey}
              readOnly
            />
            <Btn version="outline" color="secondary" onClick={handleCopyApiKey}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>content_copy</span>
              {' '}Copia
            </Btn>
          </div>
        </div>

        {/* Members */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Membri</div>
          <div>
            {members.map(([uid, member]) => (
              <div key={uid} className={styles.memberRow}>
                <span className={styles.memberEmail}>{member.email}</span>
                <div className="d-flex align-items-center gap-2">
                  <span className={`${styles.memberBadge} ${member.role === MemberRole.Admin ? styles.memberBadgeAdmin : styles.memberBadgeMember}`}>
                    {member.role === MemberRole.Admin ? 'Admin' : 'Membro'}
                  </span>
                  {uid !== project.ownerId && uid !== currentUser?.uid && (
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemoveMember(uid)}
                      title="Rimuovi membro"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_remove</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddMember}>
            <div className={styles.addMemberRow}>
              <input
                type="email"
                className="form-control"
                placeholder="Email utente..."
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
              />
              <Btn type="submit" color="primary" loading={addingMember}>
                Aggiungi
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
