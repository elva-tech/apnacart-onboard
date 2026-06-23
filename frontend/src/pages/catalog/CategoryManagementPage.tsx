import { useEffect, useState, type ReactNode } from 'react'
import { getCategories, saveCategories } from '../../api/catalogApi'
import { useCatalog } from '../../context/CatalogContext'
import { CatalogLayout } from '../../components/catalog/CatalogLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import type { Category } from '../../types/catalog'

function newCategoryId(): string {
  return `cat-${crypto.randomUUID()}`
}

export function CategoryManagementPage() {
  const { state, setCategories } = useCatalog()
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!state.merchant) return
    getCategories(state.merchant.merchantCode)
      .then(setCategories)
      .catch(() => {})
  }, [state.merchant, setCategories])

  const parentOptions = state.categories
    .filter((c) => c.level < 3)
    .map((c) => ({ value: c.id, label: c.parentName ? `${c.parentName} > ${c.name}` : c.name }))

  const addCategory = () => {
    if (!name.trim()) return
    const parent = state.categories.find((c) => c.id === parentId)
    const newCat: Category = {
      id: newCategoryId(),
      categoryId: null,
      name: name.trim(),
      parentId: parentId || null,
      parentName: parent ? (parent.parentName ? `${parent.parentName} > ${parent.name}` : parent.name) : '',
      level: parent ? parent.level + 1 : 1,
    }
    setCategories([...state.categories, newCat])
    setName('')
    setParentId('')
  }

  const saveToServer = async () => {
    if (!state.merchant) return
    setSaving(true)
    try {
      const saved = await saveCategories(state.merchant.merchantCode, state.categories)
      setCategories(saved)
      setMessage('Categories saved.')
    } catch {
      setMessage('Failed to save categories.')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = (id: string) => {
    const toRemove = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      state.categories.forEach((c) => {
        if (c.parentId && toRemove.has(c.parentId) && !toRemove.has(c.id)) {
          toRemove.add(c.id)
          changed = true
        }
      })
    }
    setCategories(state.categories.filter((c) => !toRemove.has(c.id)))
  }

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const saveEdit = () => {
    if (!editingId) return
    setCategories(
      state.categories.map((c) => (c.id === editingId ? { ...c, name: editName.trim() } : c)),
    )
    setEditingId(null)
  }

  const renderTree = (parentId: string | null, depth = 0): ReactNode => {
    return state.categories
      .filter((c) => c.parentId === parentId)
      .map((cat) => (
        <div key={cat.id} style={{ marginLeft: depth * 20 }}>
          <div className="flex items-center gap-2 py-1">
            {editingId === cat.id ? (
              <>
                <input
                  className="rounded border border-slate-200 px-2 py-1 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Button size="sm" onClick={saveEdit}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <span className="text-sm text-slate-800">{cat.name}</span>
                <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteCategory(cat.id)}>
                  Delete
                </Button>
              </>
            )}
          </div>
          {renderTree(cat.id, depth + 1)}
        </div>
      ))
  }

  return (
    <CatalogLayout
      title="Category Management"
      subtitle="Create and organize product categories with hierarchy support."
    >
      <div className="space-y-4">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Add Category</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Input label="Category Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="min-w-[200px] flex-1">
              <Select
                label="Parent Category (optional)"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                options={parentOptions}
                placeholder="None (top level)"
              />
            </div>
            <Button onClick={addCategory}>Create</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-slate-900">Category Tree</h2>
          <div className="mt-3">
            {state.categories.length === 0 ? (
              <p className="text-sm text-slate-500">No categories yet. Example: Dairy → Milk, Curd, Butter</p>
            ) : (
              renderTree(null)
            )}
          </div>
          <Button className="mt-4" loading={saving} onClick={saveToServer}>
            Save Categories
          </Button>
          {message && <p className="mt-2 text-sm text-slate-600">{message}</p>}
        </Card>
      </div>
    </CatalogLayout>
  )
}
