import React, { useContext, useEffect, useRef, useState } from 'react'

import { ModalContext } from '@/contexts/ModalContext.js'

import styles from './Shortcuts.module.css'
import IconPicker from './IconPicker.js'

interface Shortcut {
  id: string
  name?: string
  command: string
}

type ImageTab = 'upload' | 'icon'

const Shortcuts: React.FC = () => {
  const { openModals, setModalOpen } = useContext(ModalContext)
  const uploadImageRef = useRef<HTMLImageElement>(null)
  const editUploadImageRef = useRef<HTMLImageElement>(null)

  function onClickBackground(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      setModalOpen('shortcuts', false)
    }
  }

  const [shortcuts, setShortcuts] = useState<Shortcut[] | null>(null)

  const [adding, setAdding] = useState<boolean>(false)
  const [newShortcutCommand, setNewShortcutCommand] = useState<string>('')
  const [newShortcutName, setNewShortcutName] = useState<string>('')
  const [hasSetImage, setHasSetImage] = useState(false)
  const [addImageTab, setAddImageTab] = useState<ImageTab>('upload')

  const [editing, setEditing] = useState<boolean>(false)
  const [editingShortcut, setEditingShortcut] = useState<Shortcut>({
    id: '',
    name: '',
    command: ''
  })
  const [editImageTab, setEditImageTab] = useState<ImageTab>('upload')
  const [editHasSetImage, setEditHasSetImage] = useState(false)

  useEffect(() => {
    window.api.getShortcuts().then(shortcuts => {
      setShortcuts(shortcuts)
    })
  }, [])

  async function addShortcut(command: string) {
    if (!command) return

    const id = crypto.randomUUID()

    const shortcut: Shortcut = {
      id,
      name: newShortcutName,
      command
    }

    await window.api.addShortcut(shortcut)

    setShortcuts(shortcuts => [...(shortcuts || []), shortcut])

    setAdding(false)
    setNewShortcutCommand('')
    setNewShortcutName('')
    uploadImageRef.current!.src = ''
    setHasSetImage(false)
    setAddImageTab('upload')
  }

  async function removeShortcut(id: string) {
    await window.api.removeShortcut(id)

    setShortcuts(
      shortcuts => shortcuts && shortcuts.filter(s => s.id !== id)
    )

    setEditing(false)
  }

  async function updateShortcut(shortcut: Shortcut) {
    await window.api.updateShortcut(shortcut)

    setShortcuts(
      shortcuts =>
        shortcuts &&
        shortcuts.map(s => (s.id === shortcut.id ? shortcut : s))
    )

    setEditing(false)
    setEditHasSetImage(false)
    setEditImageTab('upload')
  }

  async function handleAddShortcutClose() {
    window.api.removeNewShortcutImage()
    setAdding(false)
    setNewShortcutCommand('')
    setNewShortcutName('')
    uploadImageRef.current!.src = ''
    setHasSetImage(false)
    setAddImageTab('upload')
  }

  async function handleAddIconSelect(dataUrl: string) {
    await window.api.saveShortcutIconFromDataUrl('new', dataUrl)
    uploadImageRef.current!.src = `shortcut://new?${Date.now()}`
    setHasSetImage(true)
  }

  async function handleEditIconSelect(dataUrl: string) {
    await window.api.saveShortcutIconFromDataUrl(
      editingShortcut.id,
      dataUrl
    )
    if (editUploadImageRef.current) {
      editUploadImageRef.current.src = `shortcut://${editingShortcut.id}?${Date.now()}`
    }
    setEditHasSetImage(true)
  }

  function openEditing(shortcut: Shortcut) {
    setEditing(true)
    setEditingShortcut(shortcut)
    setEditHasSetImage(false)
    setEditImageTab('upload')
  }

  return (
    <div
      className={styles.shortcuts}
      data-open={openModals.includes('shortcuts')}
      onClick={onClickBackground}
    >
      {shortcuts ? (
        <div className={styles.grid}>
          {shortcuts.map(shortcut => (
            <div
              className={styles.shortcut}
              key={shortcut.id}
              onClick={() => openEditing(shortcut)}
            >
              <img src={`shortcut://${shortcut.id}`} />
            </div>
          ))}
          {shortcuts.length < 8 ? (
            <div
              className={styles.shortcut}
              data-type="add"
              onClick={() => setAdding(true)}
            >
              <span className="material-icons">add</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Add Shortcut Modal */}
      <div
        className={styles.modal}
        data-shown={adding}
        onClick={e =>
          e.target === e.currentTarget && handleAddShortcutClose()
        }
      >
        <div className={styles.modalContent}>
          <h1>
            Add Shortcut
            <button onClick={() => handleAddShortcutClose()}>
              <span className="material-icons">close</span>
            </button>
          </h1>

          {/* Tab switcher */}
          <div className={styles.tabSwitcher}>
            <button
              className={styles.tabBtn}
              data-active={addImageTab === 'upload'}
              onClick={() => setAddImageTab('upload')}
            >
              <span className="material-icons">upload</span>
              Upload Image
            </button>
            <button
              className={styles.tabBtn}
              data-active={addImageTab === 'icon'}
              onClick={() => setAddImageTab('icon')}
            >
              <span className="material-icons">grid_view</span>
              Pick Icon
            </button>
          </div>

          {addImageTab === 'upload' ? (
            <button
              className={styles.uploadImage}
              onClick={async () => {
                const res = await window.api.uploadShortcutImage('new')
                if (!res) return
                uploadImageRef.current!.src = `shortcut://new?${Date.now()}`
                setHasSetImage(true)
              }}
            >
              <img ref={uploadImageRef} alt="" />
              <span className={styles.hint}>
                <span className="material-icons">upload</span>
                Image
              </span>
            </button>
          ) : (
            <div className={styles.iconPickerWrapper}>
              <img
                ref={uploadImageRef}
                alt=""
                className={styles.iconPreviewImg}
                data-visible={hasSetImage}
              />
              <IconPicker onSelect={handleAddIconSelect} />
            </div>
          )}

          <input
            type="text"
            placeholder="Name (optional)"
            value={newShortcutName}
            onChange={e => setNewShortcutName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Command"
            value={newShortcutCommand}
            onChange={e => setNewShortcutCommand(e.target.value)}
          />
          <div className={styles.buttons}>
            <button
              onClick={() => addShortcut(newShortcutCommand)}
              disabled={!newShortcutCommand || !hasSetImage}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Edit Shortcut Modal */}
      <div
        className={styles.modal}
        data-shown={editing}
        onClick={e => e.target === e.currentTarget && setEditing(false)}
      >
        <div className={styles.modalContent}>
          <h1>
            Edit Shortcut
            <button onClick={() => setEditing(false)}>
              <span className="material-icons">close</span>
            </button>
          </h1>

          {/* Tab switcher for edit */}
          <div className={styles.tabSwitcher}>
            <button
              className={styles.tabBtn}
              data-active={editImageTab === 'upload'}
              onClick={() => setEditImageTab('upload')}
            >
              <span className="material-icons">upload</span>
              Upload Image
            </button>
            <button
              className={styles.tabBtn}
              data-active={editImageTab === 'icon'}
              onClick={() => setEditImageTab('icon')}
            >
              <span className="material-icons">grid_view</span>
              Pick Icon
            </button>
          </div>

          {editImageTab === 'upload' ? (
            <button
              className={styles.uploadImage}
              onClick={async () => {
                const res = await window.api.uploadShortcutImage(
                  editingShortcut.id
                )
                if (!res) return
                if (editUploadImageRef.current) {
                  editUploadImageRef.current.src = `shortcut://${editingShortcut.id}?${Date.now()}`
                }
                setEditHasSetImage(true)
              }}
            >
              <img
                ref={editUploadImageRef}
                src={
                  editingShortcut.id
                    ? `shortcut://${editingShortcut.id}`
                    : ''
                }
                alt=""
              />
              <span className={styles.hint}>
                <span className="material-icons">upload</span>
                Image
              </span>
            </button>
          ) : (
            <div className={styles.iconPickerWrapper}>
              <img
                ref={editUploadImageRef}
                src={
                  editingShortcut.id && editHasSetImage
                    ? `shortcut://${editingShortcut.id}?${Date.now()}`
                    : ''
                }
                alt=""
                className={styles.iconPreviewImg}
                data-visible={editHasSetImage}
              />
              <IconPicker onSelect={handleEditIconSelect} />
            </div>
          )}

          <input
            type="text"
            placeholder="Name (optional)"
            value={editingShortcut.name ?? ''}
            onChange={e =>
              setEditingShortcut({
                ...editingShortcut,
                name: e.target.value
              })
            }
          />
          <input
            type="text"
            placeholder="Command"
            value={editingShortcut.command}
            onChange={e =>
              setEditingShortcut({
                ...editingShortcut,
                command: e.target.value
              })
            }
          />
          <div className={styles.buttons}>
            <button
              onClick={() => removeShortcut(editingShortcut.id)}
              data-type="danger"
            >
              Delete
            </button>
            <button
              onClick={() => updateShortcut(editingShortcut!)}
              disabled={!editingShortcut.command}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Shortcuts
