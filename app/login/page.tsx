'use client'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login(){
 const router=useRouter()
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(false)
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); setLoading(true); setError('')
  const f=new FormData(e.currentTarget)
  const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:f.get('identifier'),password:f.get('password')})})
  const d=await r.json()
  if(!r.ok){setError(d.error||'Login failed');setLoading(false);return}
  router.push('/dashboard'); router.refresh()
 }
 return <main className="auth-wrap"><div className="auth-card"><Link className="small-link" href="/">← BuildTrack</Link><h1>Welcome back</h1><p className="muted">Log in to your garage.</p><form className="form" onSubmit={submit}>{error&&<div className="error">{error}</div>}<label>Username or email<input name="identifier" required autoComplete="username"/></label><label>Password<input name="password" type="password" required autoComplete="current-password"/></label><button className="btn btn-primary" disabled={loading}>{loading?'Logging in…':'Log in'}</button></form><p className="muted">New to BuildTrack? <Link className="small-link" href="/register">Create an account</Link></p></div></main>
}