'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
type Build={id:string;year:number;make:string;model:string;trim?:string|null;nickname?:string|null;description?:string|null;progress:number;budget:number;spent:number;parts:any[];tasks:any[];expenses:any[];journal:any[]}
export default function BuildPage(){
 const {id}=useParams<{id:string}>(); const [build,setBuild]=useState<Build|null>(null); const [error,setError]=useState('')
 useEffect(()=>{fetch('/api/builds/'+id).then(async r=>{if(r.status===401){location.href='/login';return}const d=await r.json();if(!r.ok)throw Error(d.error);setBuild(d.build)}).catch(e=>setError(e.message))},[id])
 if(error)return <main className="auth-wrap"><div className="auth-card"><p className="error">{error}</p><Link className="small-link" href="/dashboard">Back to garage</Link></div></main>
 if(!build)return <main className="auth-wrap"><p className="muted">Loading build…</p></main>
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><Link className="btn btn-ghost" href="/dashboard">← Garage</Link></div></header><section className="dash-main"><div className="dash-head"><div><div className="build-meta">{build.year} {build.make}</div><h1>{build.model}</h1><p className="muted">{build.trim||''} {build.nickname?'· '+build.nickname:''}</p></div></div><div className="feature-grid" style={{padding:0}}><div className="feature"><b>PROGRESS</b><h3>{build.progress}%</h3><div className="progress"><i style={{width:build.progress+'%'}}/></div></div><div className="feature"><b>BUDGET</b><h3>{'$'+build.budget.toLocaleString()}</h3><p>{'$'+build.spent.toLocaleString()} spent</p></div><div className="feature"><b>PARTS</b><h3>{build.parts.length}</h3><p>Tracked parts</p></div></div><div className="feature" style={{marginTop:16}}><b>BUILD NOTES</b><h3>{build.nickname||'My build'}</h3><p>{build.description||'No description yet. Add details, parts and progress as you build.'}</p></div></section></main>
}