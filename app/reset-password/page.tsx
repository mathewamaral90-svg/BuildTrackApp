'use client'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ResetForm(){
 const params=useSearchParams(); const [error,setError]=useState(''); const [loading,setLoading]=useState(false); const [done,setDone]=useState(false)
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);setError('');const f=new FormData(e.currentTarget);const password=String(f.get('password')||'');const confirm=String(f.get('confirm')||'');if(password!==confirm){setError('Passwords do not match.');setLoading(false);return}try{const r=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:params.get('token'),password})});const d=await r.json();if(!r.ok){setError(d.error||'Unable to reset password.');}else setDone(true)}catch{setError('Connection error. Please try again.')}finally{setLoading(false)}}
 if(done)return <main className="auth-wrap"><div className="auth-card"><h1>Password updated</h1><p className="muted">Your password has been changed. You can now log in with your new password.</p><Link className="btn btn-primary" href="/login">Go to login</Link></div></main>
 return <main className="auth-wrap"><div className="auth-card"><Link className="small-link" href="/login">← Back to login</Link><h1>Set a new password</h1><p className="muted">Choose a new password with at least 8 characters.</p><form className="form" onSubmit={submit}>{error&&<div className="error">{error}</div>}<label>New password<input name="password" type="password" minLength={8} required autoComplete="new-password"/></label><label>Confirm password<input name="confirm" type="password" minLength={8} required autoComplete="new-password"/></label><button className="btn btn-primary" disabled={loading}>{loading?'Updating…':'Update password'}</button></form></div></main>
}
export default function ResetPassword(){return <Suspense fallback={<main className="auth-wrap"><div className="auth-card"><p className="muted">Loading reset form…</p></div></main>}><ResetForm/></Suspense>}
