import { Panel } from './MasterAdminUI'
export { default as IdCardPage } from './id-card/IdCardPage.jsx'

export function CctvPage() {
  const cams = ['Reception', 'Computer Lab 1', 'Computer Lab 2', 'Corridor', 'Gate', 'Office']
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cams.map((cam) => (
        <Panel key={cam} title={cam}>
          <div className="flex aspect-video items-center justify-center rounded-lg bg-navy-950 text-xs font-semibold text-white/50">
            Demo feed · {cam}
          </div>
        </Panel>
      ))}
    </div>
  )
}

export function CmsPage({ title }) {
  return (
    <Panel title={title}>
      <p className="text-sm text-slate-600">
        Website content for this block can be managed here. This is a frontend workspace for TNS landing sections — not connected to a CMS server yet.
      </p>
      <textarea className="mt-3 w-full rounded-lg border border-slate-200 p-3 text-sm" rows={6} defaultValue={`${title} draft content for TNS ITI & Computer, Narsinghpur.`} />
      <button type="button" className="btn-primary mt-3">Save draft</button>
    </Panel>
  )
}
