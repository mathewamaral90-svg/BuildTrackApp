'use client'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
export default function Register(){
 const router=useRouter(); const [error,setError]=useState(''); const [loading,setLoading]=useState(false)
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); setLoading(true); setError('')
  try{const f=new FormData(e.currentTarget); const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:f.get('username'),displayName:f.get('displayName'),email:f.get('email'),password:f.get('password')})}); const d=await r.json().catch(()=>({}))
   if(!r.ok){setError(d.error||'Could not create account');setLoading(false);return}
   router.push('/dashboard'); router.refresh()
  }catch{setError('Connection error. Please try again.');setLoading(false)}
 }
 return <main className="auth-wrap"><div className="auth-card"><Link className="small-link" href="/">← BuildTrack</Link><h1>Create your garage</h1><p className="muted">Create your account and start documenting your builds.</p><form className="form" onSubmit={submit}>{error&&<div className="error">{error}</div>}<label>Display name<input name="displayName" required maxLength={60}/></label><label>Username<input name="username" required pattern="[A-Za-z0-9_]{3,24}" placeholder="evo_mick"/></label><label>Email <span className="muted">(optional)</span><input name="email" type="email" autoComplete="email"/></label><label>Password<input name="password" type="password" minLength={8} required autoComplete="new-password"/></label><button className="btn btn-primary" disabled={loading}>{loading?'Creating…':'Create account'}</button></form><p className="muted">Already have an account? <Link className="small-link" href="/login">Log in</Link></p></div></main>
}