import { PrintButton } from './print-button'

export function ReportShell(props: {
  club: string
  title: string
  from: string
  to: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <article className="mx-auto max-w-4xl space-y-6">
      <header className="border-b-2 border-foreground pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-4 print:hidden">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">{props.club}</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{props.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{props.from} – {props.to}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden self-start">
          {props.actions}
          <PrintButton />
        </div>
      </header>

      {props.children}
    </article>
  )
}
