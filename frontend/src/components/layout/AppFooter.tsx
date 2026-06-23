import { ElvaLogo } from '../branding/ElvaLogo'

export function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center sm:px-6 sm:py-8">
        <ElvaLogo height={44} linkable={false} />
        <p className="text-xs text-slate-500">
          © {year} ELVA. All rights reserved. ApnaCart Merchant Onboarding is powered by ELVA.
        </p>
      </div>
    </footer>
  )
}
