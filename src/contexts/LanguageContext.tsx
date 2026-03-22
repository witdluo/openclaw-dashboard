import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { zh, Language } from '../locales/zh'
import { en } from '../locales/en'

type LangCode = 'zh' | 'en'

const translations: Record<LangCode, Language> = { zh, en }

interface LanguageContextType {
  lang: LangCode
  t: Language
  setLang: (lang: LangCode) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'zh',
  t: zh,
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('openclaw-dashboard-lang')
      if (saved === 'en' || saved === 'zh') return saved
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('zh')) return 'zh'
      return 'en'
    }
    return 'zh'
  })

  const setLang = (newLang: LangCode) => {
    setLangState(newLang)
    localStorage.setItem('openclaw-dashboard-lang', newLang)
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}