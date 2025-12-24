import { Header } from './Header'

interface PageContainerProps {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PageContainer({
  title,
  description,
  actions,
  children,
}: PageContainerProps) {
  return (
    <>
      <Header title={title} description={description} actions={actions} />
      <div className="p-6">{children}</div>
    </>
  )
}
