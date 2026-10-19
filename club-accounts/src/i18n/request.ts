import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
  return {
    locale: 'en',
    messages: (await import('../../messages/en.json')).default,
  }
})
