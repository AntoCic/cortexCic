import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../components/firebase/firebase';
import { useAppSelector } from '../../../store';
import { updateProject, addMember, removeMember, regenerateApiKey } from '../../../db/projects/projectRepo';
import {
  getProjectIdentifierError,
  normalizeProjectIdentifierInput,
  suggestProjectIdentifier,
} from '../../../db/projects/projectIdentifier';
import { MemberRole } from '../../../enums/MemberRole';
import { Btn } from '../../../components/Btn/Btn';
import { toast } from '../../../components/toast/toast';
import type { Timestamp } from 'firebase/firestore';
import { Timestamp as FsTimestamp } from 'firebase/firestore';
import { HUB_LOG_URL } from '../../../firebase-config';
import DeleteProjectModal from './cmp/DeleteProjectModal';
import ConfirmModal from '../../../components/ConfirmModal/ConfirmModal';
import styles from './Settings.module.css';

const Settings = () => {
  const project = useAppSelector((s) => s.projects.currentProject);
  const currentUser = useAppSelector((s) => s.auth.user);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  const [addEmail, setAddEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setIdentifier(project.identifier ?? suggestProjectIdentifier(project.name));
    }
  }, [project]);

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
    const identifierError = getProjectIdentifierError(identifier);
    if (identifierError) {
      toast.error(identifierError);
      return;
    }
    setSavingInfo(true);
    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        identifier,
      });
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

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(HUB_LOG_URL).then(() => toast.success('Endpoint copiato'));
  };

  const integrationPrompt = `Implement \`hubLog\` in this project to integrate with cortexCic.

Endpoint URL(HUB_LOG_URL): ${HUB_LOG_URL}
API Key(HUB_LOG_API_KEY): ${project.apiKey}

Store both values in environment variables or secrets — never hardcode them.

---

Create a \`hubLog\` utility (e.g. \`src/lib/hubLog.ts\` or \`utils/hubLog.ts\`). It must expose:

  hubLog.info(message, payload?)     // significant runtime events
  hubLog.error(message, payload?)    // exceptions and production errors
  hubLog.warning(message, payload?)  // degraded-state situations
  hubLog.deploy(message, payload?)   // deployment events
  hubLog.success(message, payload?)  // successful outcomes

Each method POSTs to the endpoint with:
  - Header: \`api-key: <HUB_LOG_API_KEY>\`
  - Body: { message: string, type: 'info'|'error'|'warning'|'deploy'|'success', payload?: object, showPush?: boolean }

Frontend projects: do NOT call the endpoint directly from the browser.
Route log calls through a backend handler that keeps the API key server-side.

---

After implementing hubLog, apply it throughout the codebase wherever production
errors are swallowed, console-logged, or significant events occur.

Then add a short section to CLAUDE.md (or AGENTS.md):

## Logging & error reporting

Use \`hubLog\` (cortexCic integration) for logging and error reporting.

- \`hubLog.error()\` — exceptions and production errors
- \`hubLog.warning()\` — degraded-state situations
- \`hubLog.info()\` — significant runtime events
- \`hubLog.deploy()\` — deployment events
- \`hubLog.success()\` — successful outcomes

Do not use \`console.error\` for production errors — route them through \`hubLog\`.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(integrationPrompt).then(() => toast.success('Prompt copiato'));
  };

  const handleRegenerateApiKey = async () => {
    setRegenerating(true);
    try {
      await regenerateApiKey(project.id);
      toast.success('API key rigenerata');
    } catch (error) {
      toast.error('Errore nella rigenerazione');
      throw error;
    } finally {
      setRegenerating(false);
    }
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
                onChange={(e) => {
                  const nextName = e.target.value;
                  setName(nextName);

                  if (!project?.identifier || identifier === suggestProjectIdentifier(name)) {
                    setIdentifier(suggestProjectIdentifier(nextName));
                  }
                }}
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Identificativo progetto</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={identifier}
                onChange={(e) => setIdentifier(normalizeProjectIdentifierInput(e.target.value))}
                maxLength={4}
                required
              />
              <div className="form-text">
                2-4 lettere maiuscole usate nei task, ad esempio <strong>{suggestProjectIdentifier(name)}</strong>.
              </div>
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

          <div className={styles.fieldLabel}>API Key</div>
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
            <Btn version="outline" color="danger" loading={regenerating} onClick={() => setShowRegenConfirm(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>autorenew</span>
              {' '}Rigenera
            </Btn>
          </div>

          <div className={styles.fieldLabel} style={{ marginTop: '1rem' }}>Endpoint</div>
          <div className={styles.apiKeyRow}>
            <input
              type="text"
              className={`form-control ${styles.apiKeyInput}`}
              value={HUB_LOG_URL}
              readOnly
            />
            <Btn version="outline" color="secondary" onClick={handleCopyEndpoint}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>content_copy</span>
              {' '}Copia
            </Btn>
          </div>

          <div className={styles.promptHeader}>
            <span className={styles.fieldLabel} style={{ margin: 0 }}>Prompt di integrazione</span>
            <Btn version="outline" color="secondary" onClick={handleCopyPrompt}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>content_copy</span>
              {' '}Copia prompt
            </Btn>
          </div>
          <p className="text-muted mb-2" style={{ fontSize: '0.8rem' }}>
            Copia e incolla questo prompt in Claude Code (o qualsiasi AI agent) nel progetto esterno per implementare <code>hubLog</code>.
          </p>
          <textarea
            className={styles.promptTextarea}
            value={integrationPrompt}
            readOnly
            rows={6}
          />
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
        {/* Danger zone */}
        <div className={`${styles.section} ${styles.dangerSection}`}>
          <div className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Zona pericolosa</div>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerLabel}>Elimina progetto</div>
              <div className={styles.dangerHint}>
                Una volta eliminato, non sarà possibile recuperare i dati.
              </div>
            </div>
            <Btn color="danger" version="outline" onClick={() => setShowDelete(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: 'text-bottom' }}>delete</span>
              {' '}Elimina
            </Btn>
          </div>
        </div>
      </div>

      <DeleteProjectModal
        show={showDelete}
        onClose={() => setShowDelete(false)}
        projectId={project.id}
        projectName={project.name}
      />

      <ConfirmModal
        show={showRegenConfirm}
        onClose={() => setShowRegenConfirm(false)}
        onConfirm={handleRegenerateApiKey}
        title="Rigenera API key"
        confirmLabel="Rigenera"
        confirmColor="danger"
        confirmIcon="autorenew"
        message={(
          <>
            Vuoi rigenerare la API key di questo progetto?
            <br />
            La chiave precedente <strong>smetterà di funzionare immediatamente</strong> e i progetti
            esterni andranno aggiornati con la nuova chiave.
          </>
        )}
      />
    </div>
  );
};

export default Settings;
