'use client'
import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
type Build={id:string;year:number;make:string;model:string;trim?:string|null;nickname?:string|null;description?:string|null;progress:number;budget:number;spent:number;parts:any[];tasks:any[];expenses:any[];journal:any[]}
export default function BuildPage(){
 const {id}=useParams<{id:string}>(); const [build,setBuild]=useState<Build|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false)
 async function load(){const r=await fetch('/api/builds/'+id);if(r.status===401){location.href='/login';return}const d=await r.json();if(!r.ok)throw Error(d.error);setBuild(d.build)}
 useEffect(()=>{load().catch(e=>setError(e.message))},[id])
 async function add(path:string,e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');const f=new FormData(e.currentTarget);const r=await fetch('/api/builds/'+id+'/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(f.entries()))});const d=await r.json();setSaving(false);if(!r.ok){setError(d.error);return}e.currentTarget.reset();await load()}
 async function taskStatus(taskId:string,status:string){const r=await fetch('/api/builds/'+id+'/tasks',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskId,status})});if(r.ok)await load()}
 if(error&&!build)return <main className="auth-wrap"><div className="auth-card"><p className="error">{error}</p><Link className="small-link" href="/dashboard">Back to garage</Link></div></main>
 if(!build)return <main className="auth-wrap"><p className="muted">Loading build…</p></main>
 return <main className="dashboard"><header className="topbar"><div className="topbar-inner"><Link className="brand" href="/">BUILD<span>TRACK</span></Link><Link className="btn btn-ghost" href="/dashboard">← Garage</Link></div></header>
 <section className="dash-main">
  <div className="dash-head"><div><div className="build-meta">${build.year} {build.make}</div><h1>{build.model}</h1><p className="muted">{build.trim||''} {build.nickname?'· '+build.nickname:''}</p></div></div>
  {error&&<div className="error">{error}</div>}
  <div className="feature-grid" style={{padding:0}}>
   <div className="feature"><b>PROGRESS</b><h3>${build.progress}%</h3><div className="progress"><i style={{width:build.progress+'%'}}/></div><p>{build.tasks.filter(t=>t.status==='done').length} of {build.tasks.length} tasks complete</p></div>
   <div className="feature"><b>BUDGET</b><h3>${build.budget.toLocaleString()}</h3><p>${build.spent.toLocaleString()} spent</p></div>
   <div className="feature"><b>PARTS</b><h3>{build.parts.length}</h3><p>Tracked parts</p></div>
  </div>
  <div className="manage-grid">
   <div className="panel"><h2>Parts</h2><form className="inline-form" onSubmit={e=>add('parts',e)}><input name="name" placeholder="Part name" required/><input name="manufacturer" placeholder="Manufacturer"/><input name="price" type="number" step=".01" placeholder="Price"/><button className="btn btn-primary" disabled={saving}>Add</button></form><div className="list">{build.parts.map(p=><div className="list-row" key={p.id}><div><b>{p.name}</b><small>{p.manufacturer||'No manufacturer'} · {p.status}</small></div><strong>${Number(p.price).toLocaleString()}</strong></div>)}{!build.parts.length&&<p className="muted">No parts tracked yet.</p>}</div></div>
   <div className="panel"><h2>Tasks</h2><form className="inline-form" onSubmit={e=>add('tasks',e)}><input name="name" placeholder="Task to complete" required/><button className="btn btn-primary" disabled={saving}>Add</button></form><div className="list">{build.tasks.map(t=><div className="list-row" key={t.id}><button className="check" onClick={()=>taskStatus(t.id,t.status==='done'?'todo':'done')}>{t.status==='done'?'✓':'○'}</button><div><b className={t.status==='done'?'done':''}>{t.name}</b><small>{t.priority} priority</small></div></div>)}{!build.tasks.length&&<p className="muted">No tasks yet. Add your first one.</p>}</div></div>
   <div className="panel"><h2>Expenses</h2><form className="inline-form" onSubmit={e=>add('expenses',e)}><input name="description" placeholder="What did you buy?" required/><input name="amount" type="number" step=".01" placeholder="Amount" required/><button className="btn btn-primary" disabled={saving}>Add</button></form><div className="list">{build.expenses.map(x=><div className="list-row" key={x.id}><div><b>{x.description}</b><small>{new Date(x.createdAt).toLocaleDateString()}</small></div><strong>${Number(x.amount).toLocaleString()}</strong></div>)}{!build.expenses.length&&<p className="muted">No expenses recorded.</p>}</div></div>
   <div className="panel"><h2>Build Journal</h2><form className="form" onSubmit={e=>add('journal',e)}><input name="title" placeholder="Entry title" required/><textarea name="content" placeholder="What did you do to the car today?" required/><button className="btn btn-primary" disabled={saving}>Post journal entry</button></form><div className="list">{build.journal.map(j=><article className="journal" key={j.id}><small>{new Date(j.createdAt).toLocaleDateString()}</small><h3>{j.title}</h3><p>{j.content}</p></article>)}{!build.journal.length&&<p className="muted">Your build story starts here.</p>}</div></div>
  </div>
 </section></main>
}