<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useCookie, useSeoMeta } from '#imports';
import { Activity, ArrowLeft, CheckCircle2, CircleAlert, Code2, Eye, EyeOff, FileText, FolderOpen, GraduationCap, ImagePlus, LayoutDashboard, List, Loader2, LogOut, MessageSquareText, Pencil, Plus, Save, Settings2, ShieldCheck, Sparkles, Trash2, UploadCloud, X } from 'lucide-vue-next';
import AdminMazeBackdrop from '~/components/AdminMazeBackdrop.vue';
import type { Achievement, JourneyItem, Profile, Project, Skill, Technology, TechnologyCatalogItem } from '~/composables/usePortfolioData';
import { socialNetworks } from '~/composables/socialNetworks';
import { getAiTypeLabel } from '~/composables/aiCatalog';
useSeoMeta({ title: 'Administration — Carrel DOSSOU', robots: 'noindex, nofollow' });
type Resource = 'projects'|'journey'|'educations'|'certifications'|'achievements'|'testimonials'|'skills'|'technologies';
const tabs: {id:string,label:string,icon:any}[]=[{id:'overview',label:'Vue d’ensemble',icon:LayoutDashboard},{id:'projects',label:'Projets',icon:Code2},{id:'journey',label:'Expériences & parcours',icon:Activity},{id:'educations',label:'Formations & diplômes',icon:GraduationCap},{id:'certifications',label:'Certifications',icon:ShieldCheck},{id:'achievements',label:'Réalisations',icon:Activity},{id:'testimonials',label:'Témoignages',icon:MessageSquareText},{id:'skills',label:'Compétences',icon:ShieldCheck},{id:'technologies',label:'Technologies',icon:Settings2},{id:'ai',label:'IA & modèles',icon:Sparkles},{id:'cv',label:'Importer un CV',icon:FileText},{id:'profile',label:'Profil & image',icon:ImagePlus},{id:'messages',label:'Messages',icon:MessageSquareText},{id:'settings',label:'Réglages du site',icon:Settings2},{id:'analytics',label:'Statistiques',icon:Activity},{id:'activity',label:'Journal admin',icon:FileText}];
const csrfHeaders=()=>({'x-admin-csrf':document.cookie.split('; ').find(cookie=>cookie.startsWith('carrel_admin_csrf='))?.slice('carrel_admin_csrf='.length)||''});
const loggedIn=ref(false);const checking=ref(true);const email=ref('');const password=ref('');const otpCode=ref('');const mfaSetupRequired=ref(false);const mfaSecret=ref('');const mfaUri=ref('');const recoveryCodes=ref<string[]>([]);const busy=ref(false);const error=ref('');const notice=ref('');const activeTab=ref('overview');
const profile=reactive<Profile>({name:'',role:'',location:'',education:'',bio:'',avatarUrl:null,email:null,githubUrl:null,linkedinUrl:null,socialLinks:[],available:true});
const adminDataLoaded=ref(false);
const initialDataLoading=ref(false);
const resourcePage=ref(1);
const pageSize=24;
const lists=reactive<Record<Resource,any[]>>({projects:[],journey:[],educations:[],certifications:[],achievements:[],testimonials:[],skills:[],technologies:[]});const messages=ref<any[]>([]);const editorOpen=ref(false);const editing=ref<any>(null);const editor=reactive<Record<string,any>>({});const uploadInput=ref<HTMLInputElement|null>(null);const projectImageInput=ref<HTMLInputElement|null>(null);const bulkSkillsText=ref('');const bulkSkillsResult=ref<{created:number;total:number;errors:string[]}|null>(null);
const galleryImageInput=ref<HTMLInputElement|null>(null);
const galleryReplaceIndex=ref<number|null>(null);
const galleryUploadStatus=ref('');
const messageSearch=ref('');
const messageStatusFilter=ref('all');
const csvSkillsText=ref('');
const csvSkillPreview=ref<{line:number;name:string;category:string;level:number;icon:string;error:string;duplicate:boolean}[]>([]);
const csvSkillReport=ref('');
const cvFileInput=ref<HTMLInputElement|null>(null);
const cvExtractedText=ref('');
const cvFilename=ref('');
const siteSettings=reactive({visiblePages:{parcours:true,projets:true,competences:true,ia:true,certifications:true,contact:true} as Record<string,boolean>,appointmentUrl:'',cvUrl:'',missionTypes:[] as string[],background:{showImage:true,showAmbient:false,showMaze:false,ambientIntensity:35,mazeIntensity:45,speed:1},contactRetentionDays:365});
const missionTypesText=ref('');
const serviceHealth=ref<{database:string;smtp:string;cloudinaryConfigured:boolean;checkedAt:string}|null>(null);
const activityItems=ref<any[]>([]);
const pageViewItems=ref<any[]>([]);
const purgeNotice=ref('');
const iconKind=computed({get:()=>/^https?:\/\//i.test(String(editor.icon||''))?'image':/^(?:logos|devicon|simple-icons):/i.test(String(editor.icon||''))?'logo':'text',set:(kind:string)=>{if(kind==='logo'&&!/^(?:logos|devicon|simple-icons):/i.test(String(editor.icon||'')))editor.icon='logos:';else if(kind==='image'&&!/^https?:\/\//i.test(String(editor.icon||'')))editor.icon='https://';else if(kind==='text'&&!/^text:/i.test(String(editor.icon||'')))editor.icon='text:'}});
const localTechnologyCatalog:TechnologyCatalogItem[]=[
  {name:'JavaScript',icon:'logos:javascript',category:'Langages'},{name:'TypeScript',icon:'logos:typescript-icon',category:'Langages'},{name:'Vue.js',icon:'logos:vue',category:'Frameworks'},{name:'Nuxt',icon:'logos:nuxt-icon',category:'Frameworks'},{name:'React',icon:'logos:react',category:'Frameworks'},{name:'Node.js',icon:'logos:nodejs-icon',category:'Runtimes & API'},{name:'Python',icon:'logos:python',category:'Langages'},{name:'HTML',icon:'logos:html-5',category:'Langages'},{name:'CSS',icon:'logos:css-3',category:'Langages'},{name:'Tailwind CSS',icon:'logos:tailwindcss-icon',category:'Frameworks'},{name:'PostgreSQL',icon:'logos:postgresql',category:'Bases de données'},{name:'Docker',icon:'logos:docker-icon',category:'Outils & Cloud'},{name:'GitHub',icon:'logos:github-icon',category:'Outils & Cloud'},{name:'Figma',icon:'logos:figma',category:'Outils & Cloud'},{name:'OpenAI',icon:'logos:openai-icon',category:'IA'},{name:'Anthropic',icon:'logos:anthropic-icon',category:'IA'},{name:'Google Gemini',icon:'logos:google-gemini-icon',category:'IA'},{name:'Mistral AI',icon:'logos:mistral-ai-icon',category:'IA'},{name:'GitHub Copilot',icon:'logos:github-copilot',category:'IA'},{name:'Hugging Face',icon:'logos:hugging-face-icon',category:'IA'},
];
const technologyCatalog=ref<TechnologyCatalogItem[]>([]);const technologyCatalogSource=ref('');const technologyCatalogWarning=ref('');const technologyCatalogLoading=ref(false);const technologyCatalogLoaded=ref(false);
const immersiveMode=ref(false);const projectViewMode=ref<'folders'|'list'|'document'>('folders');
const showBackdropControls=ref(false);const adminBackdropPreferences=useCookie<{showImage:boolean;showAmbient:boolean;showMaze:boolean;ambientIntensity:number;mazeIntensity:number;speed:number}>('carrel-admin-backdrop',{default:()=>({showImage:true,showAmbient:true,showMaze:true,ambientIntensity:65,mazeIntensity:72,speed:1}),maxAge:60*60*24*365,sameSite:'lax'});
const adminBackdropStyle=computed(()=>({'--admin-ambient-intensity':String(adminBackdropPreferences.value.ambientIntensity/100),'--admin-maze-intensity':String(adminBackdropPreferences.value.mazeIntensity/100)}));
function resetAdminBackdrop(){adminBackdropPreferences.value={showImage:true,showAmbient:true,showMaze:true,ambientIntensity:65,mazeIntensity:72,speed:1}}
const aiProviders=computed(()=>lists.technologies.filter(item=>item.category==='IA'&&item.aiType==='provider'&&item.id!==editing.value?.id));
const resourceLabels:Record<Resource,string>={projects:'Projets',journey:'Expériences & parcours',educations:'Formations & diplômes',certifications:'Certifications',achievements:'Réalisations',testimonials:'Témoignages',skills:'Compétences',technologies:'Technologies'};
const overviewStats=computed(()=>[
  {label:'Projets publiés',value:lists.projects.filter(item=>item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())).length},
  {label:'Projets en brouillon',value:lists.projects.filter(item=>item.publicationStatus!=='published'||(item.publishAt&&new Date(item.publishAt)>new Date())).length},
  {label:'Compétences',value:lists.skills.length},
  {label:'Technologies',value:lists.technologies.filter(item=>item.category!=='IA').length},
  {label:'Outils IA',value:lists.technologies.filter(item=>item.category==='IA').length},
  {label:'Formations',value:lists.educations.length},
  {label:'Certifications',value:lists.certifications.length},
  {label:'Témoignages autorisés',value:lists.testimonials.filter(item=>item.permissionConfirmed).length},
  {label:'Étapes de parcours',value:lists.journey.length},
  {label:'Messages nouveaux',value:messages.value.filter(message=>!message.archivedAt&&message.processingStatus==='new').length},
]);
const latestContentActivity = computed(() => activityItems.value[0] || null);
function requestErrorMessage(value:unknown,fallback:string){if(value&&typeof value==='object'){const error=value as {statusMessage?:unknown;message?:unknown;data?:{statusMessage?:unknown;message?:unknown}};for(const message of [error.data?.statusMessage,error.data?.message,error.statusMessage,error.message])if(typeof message==='string'&&message.trim())return message}return fallback}
async function loadTechnologyCatalog(force=false){if(technologyCatalogLoading.value||technologyCatalogLoaded.value&&!force)return;technologyCatalogLoading.value=true;try{const result=await $fetch<{source:string;items:TechnologyCatalogItem[];warning?:string}>('/api/technology-catalog');technologyCatalog.value=result.items;technologyCatalogSource.value=result.source;technologyCatalogWarning.value=result.warning||'';technologyCatalogLoaded.value=true}catch(error){technologyCatalog.value=localTechnologyCatalog;technologyCatalogSource.value='local';technologyCatalogWarning.value=`${requestErrorMessage(error,'Le catalogue en ligne ne répond pas.') } Une sélection locale reste disponible.`;technologyCatalogLoaded.value=true}finally{technologyCatalogLoading.value=false}}
function changeTab(id:string){activeTab.value=id;resourcePage.value=1;if(['technologies','skills','ai'].includes(id))void loadTechnologyCatalog();if(['overview','analytics','activity'].includes(id))void loadOperations()}
async function loadOperations(){try{if(activeTab.value==='analytics')pageViewItems.value=await $fetch<any[]>('/api/admin/analytics');if(['overview','activity'].includes(activeTab.value))activityItems.value=await $fetch<any[]>('/api/admin/activity')}catch(e:unknown){error.value=requestErrorMessage(e,'Impossible de charger ces informations.')}}
async function changeTabWithData(id:string){changeTab(id);if(['analytics','activity'].includes(id))await loadOperations()}
async function saveSiteSettings(){busy.value=true;error.value='';try{const saved=await $fetch<any>('/api/admin/settings',{method:'PUT',body:{public:{...siteSettings,missionTypes:missionTypesText.value.split(',').map(value=>value.trim()).filter(Boolean)},contactRetentionDays:siteSettings.contactRetentionDays},headers:csrfHeaders()});Object.assign(siteSettings,{...saved.public,background:{...siteSettings.background,...saved.public.background},contactRetentionDays:saved.contactRetentionDays});missionTypesText.value=siteSettings.missionTypes.join(', ');notice.value='Réglages enregistrés.'}catch(e:unknown){error.value=requestErrorMessage(e,'Enregistrement des réglages impossible.')}finally{busy.value=false}}
async function checkServices(){busy.value=true;try{serviceHealth.value=await $fetch('/api/admin/services');}catch(e:unknown){error.value=requestErrorMessage(e,'Vérification des services impossible.')}finally{busy.value=false}}
async function purgeOldMessages(){if(!confirm(`Supprimer définitivement les messages datant de plus de ${siteSettings.contactRetentionDays} jours ? Cette action est irréversible.`))return;busy.value=true;purgeNotice.value='';try{const result=await $fetch<{deleted:number;retentionDays:number}>('/api/admin/messages/purge',{method:'POST',headers:csrfHeaders()});purgeNotice.value=`${result.deleted} message(s) supprimé(s) au-delà de ${result.retentionDays} jours.`;messages.value=await $fetch<any[]>('/api/admin/messages')}catch(e:unknown){error.value=requestErrorMessage(e,'Purge des messages impossible.')}finally{busy.value=false}}
async function undoActivity(item:any){if(!confirm(`Annuler « ${item.summary} » ?`))return;busy.value=true;try{await $fetch(`/api/admin/activity/${item.id}/undo`,{method:'POST',headers:csrfHeaders()});await loadAll();notice.value='Dernière action annulée.'}catch(e:unknown){error.value=requestErrorMessage(e,'Annulation impossible ou action devenue obsolète.')}finally{busy.value=false}}
async function loadMfaSetup(){const setup=await $fetch<{secret:string;uri:string}>('/api/admin/mfa/setup',{method:'POST',headers:csrfHeaders()});mfaSecret.value=setup.secret;mfaUri.value=setup.uri}
async function checkSession(){checking.value=true;try{const state=await $fetch<{authenticated:boolean;setupRequired:boolean}>('/api/admin/session');loggedIn.value=state.authenticated;mfaSetupRequired.value=state.setupRequired;if(state.setupRequired)await loadMfaSetup();if(loggedIn.value)void loadAll()}catch{loggedIn.value=false;mfaSetupRequired.value=false}finally{checking.value=false}}
async function login(){busy.value=true;error.value='';try{const result=await $fetch<{authenticated:boolean;setupRequired:boolean}>('/api/admin/login',{method:'POST',body:{email:email.value,password:password.value,otp:otpCode.value}});password.value='';otpCode.value='';loggedIn.value=result.authenticated;mfaSetupRequired.value=result.setupRequired;if(result.setupRequired)await loadMfaSetup();else void loadAll()}catch(e:any){error.value=e?.data?.statusMessage||'Connexion refusée. Vérifie tes identifiants et ton code de sécurité.'}finally{busy.value=false}}
async function confirmMfaSetup(){busy.value=true;error.value='';try{const result=await $fetch<{authenticated:boolean;recoveryCodes:string[]}>('/api/admin/mfa/confirm',{method:'POST',body:{code:otpCode.value},headers:csrfHeaders()});otpCode.value='';mfaSetupRequired.value=false;loggedIn.value=result.authenticated;recoveryCodes.value=result.recoveryCodes}catch(e:any){error.value=e?.data?.statusMessage||'Impossible de confirmer la double authentification.'}finally{busy.value=false}}
function acknowledgeRecoveryCodes(){recoveryCodes.value=[];void loadAll()}
async function loadAll(){error.value='';const initialLoad=!adminDataLoaded.value;if(initialLoad)initialDataLoading.value=true;try{const resources=Object.keys(lists) as Resource[];if(adminDataLoaded.value){const refreshResources:Resource[]=activeTab.value==='activity'?resources:['projects','journey','educations','certifications','achievements','testimonials','skills','technologies','ai'].includes(activeTab.value)?[resourceForTab()]:[];await Promise.all(refreshResources.map(async(resource)=>{lists[resource]=await $fetch<any[]>(`/api/admin/content/${resource}`)}));await loadOperations();return}const[p,rows,messageRows,settings]=await Promise.all([$fetch<Profile>('/api/admin/profile'),Promise.all(resources.map(async(resource)=>[resource,await $fetch<any[]>(`/api/admin/content/${resource}`)] as const)),$fetch<any[]>('/api/admin/messages'),$fetch<any>('/api/admin/settings')]);Object.assign(profile,p);for(const[resource,items]of rows)lists[resource]=items;messages.value=messageRows;Object.assign(siteSettings,{...settings.public,background:{...siteSettings.background,...settings.public.background},contactRetentionDays:settings.contactRetentionDays});missionTypesText.value=siteSettings.missionTypes.join(', ');adminDataLoaded.value=true;await loadOperations()}catch(e:unknown){error.value=requestErrorMessage(e,'Impossible de charger les données de l’administration.')}finally{if(initialLoad)initialDataLoading.value=false}}
async function logout(){await $fetch('/api/admin/logout',{method:'POST'}).catch(()=>{});loggedIn.value=false;adminDataLoaded.value=false;activeTab.value='overview'}
function resourceForTab(tab=activeTab.value):Resource{return tab==='ai'?'technologies':tab as Resource}
function blankRecord(resource:Resource){const common={sortOrder:lists[resource].length+1};if(resource==='projects')return{title:'',slug:'',description:'',tags:'',demoUrl:'',repoUrl:'',imageUrl:'',year:new Date().getFullYear().toString(),projectType:'Web',metrics:'[]',featured:true,caseRole:'',caseContext:'',responsibilities:'',outcomes:'',gallery:[],publicationStatus:'published',publishAt:'',...common};if(resource==='journey')return{role:'',organization:'',location:'',startDate:'',endDate:'',description:'',imageUrl:'',...common};if(resource==='educations')return{title:'',institution:'',degree:'',location:'',startDate:'',endDate:'',status:'completed',description:'',imageUrl:'',...common};if(resource==='certifications')return{title:'',issuer:'',issuedAt:'',expiresAt:'',credentialId:'',credentialUrl:'',skills:'',description:'',imageUrl:'',...common};if(resource==='achievements')return{title:'',description:'',date:'',icon:'Sparkles',...common};if(resource==='testimonials')return{author:'',role:'',organization:'',quote:'',permissionConfirmed:false,publicationStatus:'draft',...common};if(resource==='skills')return{name:'',icon:'',level:75,category:'Full Stack',...common};if(activeTab.value==='ai')return{name:'',icon:'',category:'IA',aiType:'tool',aiProviderId:null,aiAccessMode:'other',aiUseCases:'',aiVerifiedAt:'',description:'',officialUrl:'',...common};return{name:'',icon:'',category:'Frontend',...common}}
function openEditor(resource:Resource|'ai',item?:any){resource=resource==='ai'?'technologies':resource;editing.value=item||null;Object.keys(editor).forEach(k=>delete editor[k]);Object.assign(editor,item?{...item,tags:Array.isArray(item.tags)?item.tags.join(', '):item.tags,responsibilities:Array.isArray(item.responsibilities)?item.responsibilities.join('\n'):item.responsibilities,metrics:JSON.stringify(item.metrics||[],null,2),aiUseCases:Array.isArray(item.aiUseCases)?item.aiUseCases.join(', '):'',gallery:Array.isArray(item.gallery)?item.gallery.map((media:any)=>({...media})):[],publishAt:item.publishAt?new Date(item.publishAt).toISOString().slice(0,16):'',...(activeTab.value==='ai'?{aiType:item.aiType||'tool',aiProviderId:item.aiProviderId??null,aiAccessMode:item.aiAccessMode||'other',aiVerifiedAt:item.aiVerifiedAt||'',description:item.description||'',officialUrl:item.officialUrl||''}:{})}:blankRecord(resource));editorOpen.value=true;if(['technologies','skills'].includes(resource))void loadTechnologyCatalog()}
function setAiType(value:string){editor.aiType=value;if(value==='provider')editor.aiProviderId=null}
function aiSummary(item:any){const details=[getAiTypeLabel(item.aiType),item.aiProviderId?lists.technologies.find(provider=>provider.id===item.aiProviderId)?.name:null].filter(Boolean);return details.join(' · ')}
function selectTechnology(item:TechnologyCatalogItem){editor.name=item.name;editor.icon=item.icon;if(activeTab.value==='ai')editor.category='IA';else if(activeTab.value==='technologies'&&item.category)editor.category=item.category;}
function addTechnologyFromCatalog(item:TechnologyCatalogItem){const resource=resourceForTab();openEditor(resource);selectTechnology(item)}
async function saveRecord(){const resource=resourceForTab();busy.value=true;error.value='';try{const body={...editor};if(resource==='projects'){body.tags=String(body.tags||'').split(',').map((v:string)=>v.trim()).filter(Boolean);body.responsibilities=String(body.responsibilities||'').split(/\r?\n/).map((v:string)=>v.trim()).filter(Boolean);body.metrics=JSON.parse(String(body.metrics||'[]'));body.gallery=(Array.isArray(body.gallery)?body.gallery:[]).map((media:any,index:number)=>({...media,sortOrder:index+1}));if(body.publishAt)body.publishAt=new Date(body.publishAt).toISOString()}if(resource==='certifications')body.skills=String(body.skills||'').split(',').map((v:string)=>v.trim()).filter(Boolean);if(resource==='technologies'){body.aiUseCases=String(body.aiUseCases||'').split(',').map((v:string)=>v.trim()).filter(Boolean);for(const key of ['aiProviderId','aiType','aiAccessMode','aiVerifiedAt','description'])if(body[key]==='')body[key]=null;if(body.category!=='IA'){body.aiProviderId=null;body.aiType=null;body.aiAccessMode=null;body.aiUseCases=[];body.aiVerifiedAt=null;body.description=null;body.officialUrl=null}}for(const key of ['issuedAt','expiresAt','credentialId','credentialUrl','imageUrl','location','endDate','officialUrl','role','organization'])if(body[key]==='')body[key]=null;if(body.publishAt==='')body.publishAt=null;if(editing.value?.id)await $fetch(`/api/admin/content/${resource}/${editing.value.id}`,{method:'PATCH',body,headers:csrfHeaders()});else await $fetch(`/api/admin/content/${resource}`,{method:'POST',body,headers:csrfHeaders()});editorOpen.value=false;await loadAll();notice.value='Modifications enregistrées.';setTimeout(()=>notice.value='',3000)}catch(e:unknown){error.value=requestErrorMessage(e,'La modification n’a pas pu être enregistrée.')}finally{busy.value=false}}
function parseBulkSkillLine(line:string,lineNumber:number){const fields=line.split(',').map(value=>value.trim());if(fields.length>3)return{error:`Ligne ${lineNumber} : trois champs maximum sont acceptés.`};const[name,categoryValue,levelValue]=fields;if(!name)return{error:`Ligne ${lineNumber} : le nom de la compétence est obligatoire.`};if(name.length>120)return{error:`Ligne ${lineNumber} : le nom ne peut pas dépasser 120 caractères.`};const category=categoryValue||'Full Stack';if(category.length>80)return{error:`Ligne ${lineNumber} : la catégorie ne peut pas dépasser 80 caractères.`};let level=75;if(levelValue){if(!/^\d+$/.test(levelValue))return{error:`Ligne ${lineNumber} : le niveau doit être un nombre entier entre 0 et 100.`};level=Number(levelValue);if(level>100)return{error:`Ligne ${lineNumber} : le niveau doit être compris entre 0 et 100.`}}return{skill:{name,category,level}}}
function parseCsvRow(line:string){const fields:string[]=[];let value='';let quoted=false;for(let index=0;index<line.length;index++){const character=line[index];if(character==='"'&&line[index+1]==='"'&&quoted){value+='"';index++}else if(character==='"'){quoted=!quoted}else if(character===','&&!quoted){fields.push(value.trim());value=''}else value+=character}fields.push(value.trim());return fields}
function previewCsvSkills(){const seen=new Set(lists.skills.map((skill)=>skill.name.trim().toLocaleLowerCase('fr')));const lines=csvSkillsText.value.split(/\r?\n/).map((line,lineNumber)=>({line,lineNumber:lineNumber+1})).filter((item)=>item.line.trim());if(lines.length&&/^name|^nom$/i.test(parseCsvRow(lines[0].line)[0]||''))lines.shift();csvSkillPreview.value=lines.map(({line,lineNumber})=>{const row=parseCsvRow(line);const[name,categoryValue,levelValue,iconValue]=row;const category=categoryValue||'Full Stack';const level=levelValue===''||levelValue===undefined?75:Number(levelValue);const icon=iconValue||'';const duplicate=!!name&&seen.has(name.toLocaleLowerCase('fr'));if(name)seen.add(name.toLocaleLowerCase('fr'));const errors:string[]=[];if(!name)errors.push('Nom obligatoire.');if(name.length>120)errors.push('Nom trop long.');if(category.length>80)errors.push('Catégorie trop longue.');if(!Number.isInteger(level)||level<0||level>100)errors.push('Niveau attendu : entier 0–100.');if(row.length>4)errors.push('Quatre colonnes maximum.');if(icon.length>120)errors.push('Icône trop longue.');return{line:lineNumber,name,category,level,icon,error:errors.join(' '),duplicate}})}
async function importCsvSkills(){const candidates=csvSkillPreview.value.filter((item)=>!item.error&&!item.duplicate);if(!candidates.length){csvSkillReport.value='Aucune ligne valide et non dupliquée à importer.';return}busy.value=true;let created=0;const errors:string[]=[];let sortOrder=lists.skills.length+1;for(const item of candidates){try{await $fetch('/api/admin/content/skills',{method:'POST',body:{name:item.name,category:item.category,level:item.level,icon:item.icon,sortOrder},headers:csrfHeaders()});created++;sortOrder++}catch(e:any){errors.push(`Ligne ${item.line} (${item.name}) : ${e?.data?.statusMessage||'échec.'}`)}}await loadAll();csvSkillReport.value=`${created} compétence(s) ajoutée(s) ; ${errors.length} erreur(s).${errors.length?` ${errors.join(' ')}`:''}`;if(created)csvSkillPreview.value=[];busy.value=false}
async function addBulkSkills(){const lines=bulkSkillsText.value.split(/\r?\n/).map((line,index)=>({line,lineNumber:index+1})).filter(item=>item.line.trim());if(!lines.length){bulkSkillsResult.value={created:0,total:0,errors:['Saisis au moins une compétence.']};return}busy.value=true;bulkSkillsResult.value=null;let nextSortOrder=lists.skills.length+1;let created=0;const errors:string[]=[];const skillsToCreate:{name:string;category:string;level:number;lineNumber:number}[]=[];for(const item of lines){const parsed=parseBulkSkillLine(item.line,item.lineNumber);if(parsed.error)errors.push(parsed.error);else if(parsed.skill)skillsToCreate.push({...parsed.skill,lineNumber:item.lineNumber})}for(const skill of skillsToCreate){try{const{name,category,level}=skill;await $fetch('/api/admin/content/skills',{method:'POST',body:{name,category,level,sortOrder:nextSortOrder},headers:csrfHeaders()});created++;nextSortOrder++}catch(e:any){errors.push(`Ligne ${skill.lineNumber} (« ${skill.name} ») : ${e?.data?.statusMessage||'impossible d’enregistrer cette compétence.'}`)}}if(created)await loadAll();bulkSkillsResult.value={created,total:lines.length,errors};if(!errors.length)bulkSkillsText.value='';busy.value=false}
async function deleteRecord(resource:Resource|'ai',item:any){resource=resource==='ai'?'technologies':resource;if(!confirm(`Supprimer « ${item.title||item.name||item.role} » ?`))return;try{await $fetch(`/api/admin/content/${resource}/${item.id}`,{method:'DELETE',headers:csrfHeaders()});await loadAll();notice.value='Élément supprimé.';setTimeout(()=>notice.value='',2500)}catch(e:any){error.value=e?.data?.statusMessage||'Suppression impossible.'}}
async function updateMessage(id:number,body:{processingStatus?:'new'|'in_progress'|'done';archived?:boolean}){try{const updated=await $fetch<any>(`/api/admin/messages/${id}`,{method:'PATCH',body,headers:csrfHeaders()});const index=messages.value.findIndex((message)=>message.id===id);if(index>=0)messages.value[index]=updated}catch(e:any){error.value=e?.data?.statusMessage||'Mise à jour du message impossible.'}}
async function moveRecord(resource:Resource|'ai',item:any,direction:-1|1){const key=resourceForTab(String(resource));const rows=[...resourceRows.value];const index=rows.findIndex((row)=>row.id===item.id);const targetIndex=index+direction;if(index<0||targetIndex<0||targetIndex>=rows.length)return;const current=rows[index];const target=rows[targetIndex];busy.value=true;error.value='';try{await $fetch(`/api/admin/content/${key}/reorder`,{method:'PUT',body:{currentId:current.id,targetId:target.id},headers:csrfHeaders()});await loadAll()}catch(e:any){error.value=e?.data?.statusMessage||'Impossible de modifier l’ordre.'}finally{busy.value=false}}
async function saveProfile(){busy.value=true;error.value='';notice.value='';try{const saved=await $fetch<Profile>('/api/admin/profile',{method:'PUT',body:profile,headers:csrfHeaders()});Object.assign(profile,saved);notice.value='Profil mis à jour et enregistré.';setTimeout(()=>notice.value='',3000)}catch(e:unknown){error.value=requestErrorMessage(e,'Profil non enregistré : une erreur inconnue est survenue. Réessaie et consulte le message de l’API si le problème persiste.')}finally{busy.value=false}}
function addSocialLink(){const network=socialNetworks.find((candidate)=>!profile.socialLinks.some((link)=>link.platform===candidate.id));if(!network){error.value='Tous les réseaux disponibles ont déjà été ajoutés. Ajoute plutôt un lien personnalisé.';return}profile.socialLinks.push({platform:network.id,url:''})}
function addCustomSocialLink(){profile.socialLinks.push({platform:`custom:${Date.now()}`,url:'',customLabel:'',customIcon:'text:+'})}
function removeSocialLink(index:number){profile.socialLinks.splice(index,1)}
async function uploadAvatar(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file)return;busy.value=true;error.value='';try{const form=new FormData();form.append('file',file);const r=await $fetch<{url:string}>('/api/admin/upload',{method:'POST',body:form,headers:csrfHeaders()});profile.avatarUrl=r.url;await saveProfile();notice.value='Image de profil téléversée.'}catch(e:any){error.value=e?.data?.statusMessage||'Téléversement impossible. Vérifie la configuration Cloudinary.'}finally{busy.value=false;(event.target as HTMLInputElement).value=''}}
async function uploadProjectImage(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;busy.value=true;error.value='';try{const form=new FormData();form.append('file',file);form.append('folder',activeTab.value==='journey'?'journey':'projects');const result=await $fetch<{url:string}>('/api/admin/upload',{method:'POST',body:form,headers:csrfHeaders()});editor.imageUrl=result.url;notice.value='Image téléversée. Enregistre la fiche pour la publier.'}catch(e:any){error.value=e?.data?.statusMessage||'Téléversement impossible. Vérifie la configuration Cloudinary.'}finally{busy.value=false;input.value=''}}
function chooseGalleryUpload(index?:number){galleryReplaceIndex.value=index??null;galleryImageInput.value?.click()}
async function uploadGalleryFiles(files:File[]){if(!files.length)return;busy.value=true;error.value='';notice.value='';const gallery=Array.isArray(editor.gallery)?[...editor.gallery]:[];const issues:string[]=[];let completed=0;const maxFiles=20-gallery.length+(galleryReplaceIndex.value===null?0:1);const accepted=files.slice(0,Math.max(0,maxFiles));if(accepted.length<files.length)issues.push(`Limite de 20 images : ${files.length-accepted.length} fichier(s) ignoré(s).`);try{for(const file of accepted){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){issues.push(`${file.name} : format invalide ou fichier supérieur à 8 Mo.`);continue}galleryUploadStatus.value=`Téléversement ${completed+1}/${accepted.length} · ${file.name}`;try{const form=new FormData();form.append('file',file);form.append('folder','projects');const result=await $fetch<{url:string}>('/api/admin/upload',{method:'POST',body:form,headers:csrfHeaders()});if(galleryReplaceIndex.value!==null){const old=gallery[galleryReplaceIndex.value];gallery[galleryReplaceIndex.value]={...old,url:result.url,alt:old.alt||`Capture de ${editor.title||'projet'}`};galleryReplaceIndex.value=null}else gallery.push({url:result.url,alt:`Capture de ${editor.title||'projet'}`,caption:'',sortOrder:gallery.length+1});completed++}catch(e:unknown){issues.push(`${file.name} : ${requestErrorMessage(e,'échec du téléversement.')}`)}}editor.gallery=gallery.map((media:any,index:number)=>({...media,sortOrder:index+1}));if(completed)notice.value=`${completed} image(s) téléversée(s). Enregistre le projet pour publier.`;if(issues.length)error.value=issues.join(' ')}finally{galleryUploadStatus.value='';busy.value=false}}
function uploadGalleryImages(event:Event){const input=event.target as HTMLInputElement;void uploadGalleryFiles(Array.from(input.files||[])).finally(()=>{input.value=''})}
async function previewCv(event:Event){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;busy.value=true;error.value='';cvExtractedText.value='';try{const form=new FormData();form.append('file',file);const result=await $fetch<{filename:string;text:string}>('/api/admin/cv/preview',{method:'POST',body:form,headers:csrfHeaders()});cvFilename.value=result.filename;cvExtractedText.value=result.text}catch(e:unknown){error.value=requestErrorMessage(e,'Extraction du CV impossible. Vérifie le document.')}finally{busy.value=false;input.value=''}}
const filteredMessages=computed(()=>{const query=messageSearch.value.trim().toLocaleLowerCase('fr');return messages.value.filter((message)=>{const archived=!!message.archivedAt;if(messageStatusFilter.value==='archived'&&!archived)return false;if(messageStatusFilter.value!=='all'&&messageStatusFilter.value!=='archived'&&message.processingStatus!==messageStatusFilter.value)return false;if(messageStatusFilter.value!=='archived'&&archived)return false;return !query||[message.name,message.email,message.subject,message.message].some((value)=>String(value||'').toLocaleLowerCase('fr').includes(query))})});
const resourceRows=computed(()=>{const resource=resourceForTab();const rows=lists[resource]||[];return activeTab.value==='ai'?rows.filter((item)=>item.category==='IA'):rows});const pageCount=computed(()=>Math.max(1,Math.ceil(resourceRows.value.length/pageSize)));const activePage=computed(()=>Math.min(resourcePage.value,pageCount.value));const pageRows=computed(()=>resourceRows.value.slice((activePage.value-1)*pageSize,activePage.value*pageSize));const tableTitle=computed(()=>activeTab.value==='ai'?'IA & modèles':resourceLabels[resourceForTab()]||'');
onMounted(checkSession);
</script>
<template>
  <div :class="['admin-page', { 'admin-page--immersive': immersiveMode, 'admin-page--no-image': !adminBackdropPreferences.showImage, 'admin-page--ambient': adminBackdropPreferences.showAmbient }]" :style="adminBackdropStyle">
    <AdminMazeBackdrop v-if="loggedIn&&adminBackdropPreferences.showMaze" :speed="adminBackdropPreferences.speed" />
    <div v-if="loggedIn" class="admin-visual-controls">
      <button class="maze-mode-toggle" type="button" :aria-expanded="showBackdropControls" aria-controls="admin-backdrop-settings" @click="showBackdropControls=!showBackdropControls">
        <Settings2 :size="15" /><span>Fond</span>
      </button>
      <button class="maze-mode-toggle" type="button" :aria-pressed="immersiveMode" @click="immersiveMode=!immersiveMode">
        <EyeOff v-if="immersiveMode" :size="15" /><Eye v-else :size="15" />
        <span>{{ immersiveMode?'Afficher l’admin':'Masquer l’admin' }}</span>
      </button>
      <section v-if="showBackdropControls" id="admin-backdrop-settings" class="admin-backdrop-settings" aria-label="Réglages du fond animé">
        <div class="admin-backdrop-settings-heading"><strong>Ambiance de la console</strong><button type="button" aria-label="Fermer les réglages du fond" @click="showBackdropControls=false"><X :size="15" /></button></div>
        <label class="backdrop-toggle-option"><input v-model="adminBackdropPreferences.showImage" type="checkbox"><span>Image de fond</span><small>Photo du portfolio</small></label>
        <label class="backdrop-toggle-option"><input v-model="adminBackdropPreferences.showAmbient" type="checkbox"><span>Halo lumineux</span><small>Lueur fixe et légère sous le labyrinthe</small></label>
        <label class="backdrop-toggle-option"><input v-model="adminBackdropPreferences.showMaze" type="checkbox"><span>Labyrinthe</span><small>Génération et recherche de chemin</small></label>
        <label class="backdrop-range-option"><span>Intensité du fond <strong>{{ adminBackdropPreferences.ambientIntensity }}%</strong></span><input v-model.number="adminBackdropPreferences.ambientIntensity" type="range" min="0" max="100" step="5"></label>
        <label class="backdrop-range-option"><span>Intensité du labyrinthe <strong>{{ adminBackdropPreferences.mazeIntensity }}%</strong></span><input v-model.number="adminBackdropPreferences.mazeIntensity" type="range" min="0" max="100" step="5"></label>
        <label class="backdrop-range-option"><span>Vitesse du labyrinthe <strong>×{{ adminBackdropPreferences.speed.toFixed(1) }}</strong></span><input v-model.number="adminBackdropPreferences.speed" type="range" min="0.5" max="2" step="0.5"></label>
        <button class="backdrop-reset-button" type="button" @click="resetAdminBackdrop">Réinitialiser l’ambiance</button>
      </section>
    </div>
    <div class="admin-shell">
    <header class="admin-top"><div><a href="/" class="brand"><span class="brand-mark"><Code2 :size="15" /></span><span>carrel@dev:~$ /admin</span></a><div class="admin-title" style="margin-top:7px">Console propriétaire · espace privé</div></div><a class="button secondary" href="/"><ArrowLeft :size="14" /> Retour au portfolio</a></header>
    <div v-if="checking" class="window admin-login"><div class="eyebrow">Vérification de session</div><h1>Connexion sécurisée…</h1><p class="muted mono">// Validation en cours</p></div>
    <section v-else-if="recoveryCodes.length" class="window admin-login">
      <div class="eyebrow">Dernière étape de sécurité</div><h1>Enregistre tes codes de secours</h1>
      <p class="muted">Chaque code ne fonctionne qu’une fois. Garde-les dans un gestionnaire de mots de passe, séparément de ton appareil d’authentification. Ils ne seront plus affichés.</p>
      <div class="mfa-recovery-codes"><code v-for="code in recoveryCodes" :key="code">{{ code }}</code></div>
      <button type="button" class="button" @click="acknowledgeRecoveryCodes"><CheckCircle2 :size="15" /> J’ai enregistré mes codes</button>
    </section>
    <section v-else-if="mfaSetupRequired" class="window admin-login">
      <div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>authenticator.setup</span></div><div class="window-controls"><i></i><i></i><i></i></div></div>
      <div class="eyebrow">Configuration obligatoire · 1/2</div><h1>Active la double authentification</h1>
      <p class="muted">Dans Google Authenticator, Microsoft Authenticator, Authy ou une application compatible TOTP, ajoute un compte avec la clé ci-dessous.</p>
      <div class="mfa-secret"><span>Clé de configuration</span><code>{{ mfaSecret }}</code></div>
      <p class="muted mfa-manual">Si ton application accepte les liens de configuration, utilise celui-ci depuis cet appareil :</p>
      <a class="text-link mfa-uri" :href="mfaUri">Ouvrir dans une application compatible</a>
      <div v-if="error" class="admin-alert error"><CircleAlert :size="15" style="vertical-align:middle;margin-right:6px" />{{ error }}</div>
      <form @submit.prevent="confirmMfaSetup"><div class="field"><label for="admin-setup-otp">Code à 6 chiffres de l’application</label><input id="admin-setup-otp" v-model="otpCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required placeholder="000000"></div><button type="submit" class="button" :disabled="busy"><ShieldCheck :size="15" />{{ busy?'Vérification…':'Confirmer et protéger le compte' }}</button></form>
      <div class="login-footer">// L’inscription reste bloquée jusqu’à validation du code</div>
    </section>
    <section v-else-if="!loggedIn" class="window admin-login"><div class="window-bar"><div class="window-title"><span class="prompt">&gt;_</span><span>auth.owner</span></div><div class="window-controls"><i></i><i></i><i></i></div></div><div class="eyebrow">Zone réservée au propriétaire</div><h1>Accès administrateur</h1><p class="muted">Connecte-toi avec ton mot de passe et le code de ton application d’authentification.</p><div v-if="error" class="admin-alert error"><CircleAlert :size="15" style="vertical-align:middle;margin-right:6px" />{{ error }}</div><form @submit.prevent="login"><div class="field"><label for="admin-email">Adresse administrateur</label><input id="admin-email" v-model="email" type="email" autocomplete="username" required maxlength="320" placeholder="admin@exemple.com"></div><div class="field"><label for="admin-password">Mot de passe</label><input id="admin-password" v-model="password" type="password" autocomplete="current-password" required minlength="8" placeholder="••••••••••••"></div><div class="field"><label for="admin-otp">Code d’authentification ou code de secours</label><input id="admin-otp" v-model="otpCode" inputmode="text" autocomplete="one-time-code" maxlength="64" placeholder="000000 ou code de secours"></div><button type="submit" class="button" :disabled="busy"><ShieldCheck :size="15" />{{ busy?'Vérification…':'Ouvrir ma console' }}</button></form><div class="login-footer">// Mot de passe + authenticator · accès privé uniquement</div></section>
    <div v-else class="admin-layout">
      <aside class="window admin-nav"><button v-for="tab in tabs" :key="tab.id" :class="{selected:activeTab===tab.id}" @click="changeTab(tab.id)"><component :is="tab.icon" :size="15" />{{ tab.label }}</button><button style="margin-top:10px;color:#ff9cac" @click="logout"><LogOut :size="15" />Déconnexion</button></aside>
      <main class="window admin-content">
        <TechnologyCatalogPicker v-if="['technologies','skills','ai'].includes(activeTab)" :items="technologyCatalog" :saved="activeTab==='ai'?lists.technologies.filter(item=>item.category==='IA'):activeTab==='technologies'?lists.technologies:[]" :category-filter="activeTab==='ai'?'IA':undefined" :source="technologyCatalogSource" :warning="technologyCatalogWarning" :loading="technologyCatalogLoading" @retry="loadTechnologyCatalog(true)" @select="addTechnologyFromCatalog" @edit="openEditor('technologies', $event)" />
        <div class="admin-toolbar"><div><div class="eyebrow">Espace propriétaire</div><h1>{{ tabs.find(x=>x.id===activeTab)?.label }}</h1></div><div style="display:flex;gap:8px;align-items:center"><span v-if="initialDataLoading" class="status-chip"><Loader2 :size="14" class="admin-spinner" /> Chargement des données</span><span class="status-chip"><span class="status-dot"></span>{{ profile.name || 'Compte vérifié' }}</span><button v-if="['projects','journey','educations','certifications','achievements','testimonials','skills','technologies','ai'].includes(activeTab)" class="button" @click="openEditor(resourceForTab())"><Plus :size="15" /> Ajouter</button></div></div>
        <section v-if="activeTab==='skills'" class="window csv-skill-import">
          <h2>Import CSV avec aperçu</h2>
          <p class="muted">Colonnes : <code>nom,categorie,niveau,icone</code> (icône facultative, accepte <code>logos:python</code> ou <code>text:Py</code>). Aucun doublon n’est importé.</p>
          <textarea v-model="csvSkillsText" rows="3" placeholder="name,category,level,icon&#10;Python,Langages,80,logos:python&#10;GitHub Copilot,IA,75,logos:github-copilot"></textarea>
          <button class="button secondary" type="button" @click="previewCsvSkills">Prévisualiser et valider</button>
          <div v-if="csvSkillPreview.length" class="csv-preview">
            <div v-for="item in csvSkillPreview" :key="item.line" :class="['csv-preview-row',{invalid:item.error,duplicate:item.duplicate}]">
              <span>{{ item.line }} · {{ item.name||'Nom manquant' }}</span><span>{{ item.category }} · {{ item.level }}%</span><span>{{ item.error|| (item.duplicate?'Doublon — ignoré':'Valide') }}</span>
            </div>
            <button class="button" type="button" :disabled="busy||!csvSkillPreview.some(item=>!item.error&&!item.duplicate)" @click="importCsvSkills">Importer les lignes valides</button>
          </div>
          <p v-if="csvSkillReport" class="admin-alert" role="status">{{ csvSkillReport }}</p>
        </section>
        <div v-if="error" class="admin-alert error"><CircleAlert :size="14" style="vertical-align:middle;margin-right:6px" />{{ error }}</div><div v-if="notice" class="admin-alert success"><CheckCircle2 :size="14" style="vertical-align:middle;margin-right:6px" />{{ notice }}</div>
        <template v-if="activeTab==='overview'"><p class="muted">Le contenu du site est géré depuis cette console. Les modifications sont sauvegardées dans Neon après configuration de la base.</p><div class="admin-stats"><div v-for="stat in overviewStats" :key="stat.label" class="stat-card"><strong>{{ stat.value }}</strong><span>{{ stat.label }}</span></div></div><div class="admin-alert"><ShieldCheck :size="15" style="vertical-align:middle;margin-right:6px" />Compte propriétaire connecté. Les fichiers médias sont envoyés côté serveur à Cloudinary.</div><section class="window latest-activity"><strong>Dernière modification du contenu</strong><span v-if="latestContentActivity">{{ new Date(latestContentActivity.createdAt).toLocaleString('fr-FR') }} · {{ latestContentActivity.summary }}</span><span v-else class="muted">Aucune modification journalisée.</span></section></template>
        <template v-else-if="['projects','journey','educations','certifications','achievements','testimonials','skills','technologies','ai'].includes(activeTab)">
          <section v-if="activeTab==='skills'" class="window bulk-skills-panel">
            <h2>Ajouter plusieurs compétences</h2>
            <p class="muted">Une compétence par ligne : <span class="mono">nom, catégorie, niveau</span>. Catégorie par défaut : Full Stack · niveau par défaut : 75.</p>
            <form @submit.prevent="addBulkSkills"><div class="field full"><label for="bulk-skills">Liste des compétences</label><textarea id="bulk-skills" v-model="bulkSkillsText" rows="4" placeholder="Vue.js, Frontend, 90&#10;TypeScript&#10;Node.js, Backend, 80"></textarea></div><button type="submit" class="button" :disabled="busy"><Plus :size="14" />{{ busy?'Ajout en cours…':'Ajouter les compétences' }}</button></form>
            <div v-if="bulkSkillsResult" class="admin-alert" :class="bulkSkillsResult.errors.length?'error':'success'" role="status" style="margin-top:12px"><CheckCircle2 v-if="!bulkSkillsResult.errors.length" :size="14" style="vertical-align:middle;margin-right:6px" /><CircleAlert v-else :size="14" style="vertical-align:middle;margin-right:6px" />{{ bulkSkillsResult.errors.length?(bulkSkillsResult.created?`Ajout partiel : ${bulkSkillsResult.created}/${bulkSkillsResult.total} compétence(s) créée(s).`:`Échec complet : aucune compétence n’a été créée (0/${bulkSkillsResult.total}).`):`${bulkSkillsResult.created} compétence(s) ajoutée(s) avec succès.` }}<ul v-if="bulkSkillsResult.errors.length" style="margin:8px 0 0 20px;padding:0"><li v-for="message in bulkSkillsResult.errors" :key="message">{{ message }}</li></ul></div>
          </section>
          <p class="muted">{{ tableTitle }} · {{ resourceRows.length }} élément(s) · utilise les flèches pour l’ordre</p>
          <div v-if="activeTab==='projects'" class="project-view-toolbar" aria-label="Mode d’affichage des projets">
            <span>{{ resourceRows.length }} projets</span>
            <div>
              <button :class="{ selected: projectViewMode==='folders' }" type="button" :aria-pressed="projectViewMode==='folders'" @click="projectViewMode='folders'"><FolderOpen :size="15" /> Dossiers</button>
              <button :class="{ selected: projectViewMode==='list' }" type="button" :aria-pressed="projectViewMode==='list'" @click="projectViewMode='list'"><List :size="15" /> Liste</button>
              <button :class="{ selected: projectViewMode==='document' }" type="button" :aria-pressed="projectViewMode==='document'" @click="projectViewMode='document'"><FileText :size="15" /> Documents</button>
            </div>
          </div>
          <div v-if="activeTab==='projects'&&resourceRows.length&&projectViewMode==='folders'" class="project-folder-grid">
            <article v-for="(item,index) in pageRows" :key="item.id" class="project-folder-card">
              <div class="project-folder-art">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="`Couverture de ${item.title}`" loading="lazy">
                <div v-else class="project-folder-placeholder"><Code2 :size="30" /><span>APERÇU À AJOUTER</span></div>
                <span class="project-folder-tab"><FolderOpen :size="14" /> {{ item.projectType||'Projet' }}</span>
                <span :class="['project-publish-state',item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())?'published':'draft']">{{ item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())?'Publié':'Brouillon' }}</span>
              </div>
              <div class="project-folder-copy">
                <div><span class="project-folder-year">{{ item.year||'Portfolio' }}</span><span class="project-folder-order">DOSSIER {{ String((activePage-1)*pageSize+index+1).padStart(2,'0') }}</span></div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description||'Ajoute une description pour présenter ce projet.' }}</p>
                <div class="project-folder-footer">
                  <span>{{ Array.isArray(item.tags)?item.tags.slice(0,3).join(' · '):'' }}</span>
                  <div class="admin-actions">
                    <button class="icon-button" type="button" :aria-label="`Modifier ${item.title}`" @click="openEditor('projects',item)"><Pencil :size="14" /></button>
                    <button class="icon-button danger" type="button" :aria-label="`Supprimer ${item.title}`" @click="deleteRecord('projects',item)"><Trash2 :size="14" /></button>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div v-else-if="activeTab==='projects'&&resourceRows.length&&projectViewMode==='list'" class="project-list-view">
            <article v-for="item in pageRows" :key="item.id" class="project-list-row">
              <img v-if="item.imageUrl" :src="item.imageUrl" :alt="`Couverture de ${item.title}`" loading="lazy">
              <div v-else class="project-list-placeholder"><Code2 :size="18" /></div>
              <div><strong>{{ item.title }}</strong><span>{{ item.year||'Année non renseignée' }} · {{ item.projectType||'Projet' }}</span><small>{{ item.description }}</small></div>
              <span :class="['project-publish-state',item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())?'published':'draft']">{{ item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())?'Publié':'Brouillon' }}</span>
              <div class="admin-actions"><button class="icon-button" type="button" :aria-label="`Modifier ${item.title}`" @click="openEditor('projects',item)"><Pencil :size="14" /></button><button class="icon-button danger" type="button" :aria-label="`Supprimer ${item.title}`" @click="deleteRecord('projects',item)"><Trash2 :size="14" /></button></div>
            </article>
          </div>
          <div v-else-if="activeTab==='projects'&&resourceRows.length&&projectViewMode==='document'" class="project-document-grid">
            <article v-for="(item,index) in pageRows" :key="item.id" class="project-document-window">
              <header class="project-document-titlebar">
                <span><FileText :size="14" /> {{ item.slug||'projet' }}.md</span>
                <div class="window-controls" aria-hidden="true"><i></i><i></i><i></i></div>
              </header>
              <div class="project-document-page">
                <div class="project-document-heading">
                  <div><span class="project-document-kicker">{{ item.projectType||'PROJET' }} · {{ item.year||'PORTFOLIO' }}</span><h3>{{ item.title }}</h3></div>
                  <span :class="['project-publish-state',item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())?'published':'draft']">{{ item.publicationStatus==='published'&&(!item.publishAt||new Date(item.publishAt)<=new Date())?'Publié':'Brouillon' }}</span>
                </div>
                <img v-if="item.imageUrl" class="project-document-cover" :src="item.imageUrl" :alt="`Aperçu de ${item.title}`" loading="lazy">
                <div v-else class="project-document-placeholder"><Code2 :size="24" /><span>Aucun aperçu disponible</span></div>
                <p class="project-document-description">{{ item.description||'Ajoute une description pour présenter ce projet.' }}</p>
                <div class="project-document-footer">
                  <span class="project-document-tags">{{ Array.isArray(item.tags)?item.tags.slice(0,4).join(' · '):'' }}</span>
                  <span class="project-document-order">{{ String((activePage-1)*pageSize+index+1).padStart(2,'0') }}</span>
                  <div class="admin-actions"><button class="icon-button" type="button" :aria-label="`Modifier ${item.title}`" @click="openEditor('projects',item)"><Pencil :size="14" /></button><button class="icon-button danger" type="button" :aria-label="`Supprimer ${item.title}`" @click="deleteRecord('projects',item)"><Trash2 :size="14" /></button></div>
                </div>
              </div>
            </article>
          </div>
          <div v-else-if="resourceRows.length" style="overflow-x:auto">
            <table class="admin-table"><thead><tr><th>Élément</th><th>Détail</th><th>Ordre</th><th>Actions</th></tr></thead>
              <tbody><tr v-for="(item,index) in pageRows" :key="item.id">
                <td>{{ item.title||item.name||item.role||item.author }}</td><td>{{ activeTab==='ai'?aiSummary(item):activeTab==='testimonials'?`${item.permissionConfirmed?'Autorisation confirmée':'Autorisation à vérifier'} · ${item.publicationStatus}`:item.description||item.organization||item.institution||item.issuer||item.degree||item.category||(item.level!=null?item.level+'%':'') }}</td>
                <td><div class="sort-control"><button class="icon-button" type="button" :disabled="activePage===1&&index===0||busy" :aria-label="`Monter ${item.title||item.name||item.role}`" @click="moveRecord(resourceForTab(),item,-1)">↑</button><span>{{ item.sortOrder }}</span><button class="icon-button" type="button" :disabled="activePage===pageCount&&index===pageRows.length-1||busy" :aria-label="`Descendre ${item.title||item.name||item.role}`" @click="moveRecord(resourceForTab(),item,1)">↓</button></div></td>
                <td><div class="admin-actions"><button class="icon-button" :aria-label="`Modifier ${item.title||item.name||item.role}`" @click="openEditor(resourceForTab(),item)"><Pencil :size="14" /></button><button class="icon-button danger" :aria-label="`Supprimer ${item.title||item.name||item.role}`" @click="deleteRecord(resourceForTab(),item)"><Trash2 :size="14" /></button></div></td>
              </tr></tbody>
            </table>
          </div>
          <div v-else class="admin-empty">Aucun élément pour l’instant. Ajoute ton premier contenu avec le bouton ci-dessus.</div>
          <nav v-if="pageCount>1" class="admin-pagination" aria-label="Pagination des éléments">
            <span>Page {{ activePage }} sur {{ pageCount }} · {{ resourceRows.length }} élément(s)</span>
            <div><button class="button secondary" type="button" :disabled="activePage===1" @click="resourcePage=activePage-1">Précédent</button><button class="button secondary" type="button" :disabled="activePage===pageCount" @click="resourcePage=activePage+1">Suivant</button></div>
          </nav>
        </template>
        <template v-else-if="activeTab==='settings'">
          <p class="muted">Réglages éditoriaux et confidentialité. Les pages décochées disparaissent du menu public, sans supprimer leurs contenus.</p>
          <form class="admin-form" @submit.prevent="saveSiteSettings">
            <div class="field full"><label>Pages visibles dans la navigation publique</label><div class="page-visibility-options"><label v-for="page in [{id:'parcours',label:'Parcours'},{id:'projets',label:'Projets'},{id:'competences',label:'Compétences'},{id:'ia',label:'IA'},{id:'certifications',label:'Certifications'},{id:'contact',label:'Contact'}]" :key="page.id"><input v-model="siteSettings.visiblePages[page.id]" type="checkbox">{{ page.label }}</label></div><small class="muted">L’accueil reste toujours accessible.</small></div>
            <div class="field"><label>URL du CV PDF public</label><input v-model="siteSettings.cvUrl" type="url" placeholder="https://…"></div>
            <div class="field"><label>Lien de prise de rendez-vous</label><input v-model="siteSettings.appointmentUrl" type="url" placeholder="https://…"></div>
            <div class="field full"><label>Types de mission affichés (séparés par des virgules)</label><input v-model="missionTypesText" placeholder="Stage, freelance, emploi"></div>
            <div class="field"><label>Conservation des messages (jours)</label><input v-model.number="siteSettings.contactRetentionDays" type="number" min="30" max="3650"></div>
            <section class="window public-background-settings">
              <h2>Fond animé du site public</h2>
              <p class="muted">Le labyrinthe et le halo sont désactivés par défaut pour préserver la fluidité des visiteurs.</p>
              <div class="public-backdrop-controls">
                <label class="backdrop-toggle-option"><input v-model="siteSettings.background.showImage" type="checkbox"><span>Image de fond</span><small>Conserver le décor actuel</small></label>
                <label class="backdrop-toggle-option"><input v-model="siteSettings.background.showAmbient" type="checkbox"><span>Halo lumineux</span><small>Dégradé fixe, sans animation continue</small></label>
                <label class="backdrop-toggle-option"><input v-model="siteSettings.background.showMaze" type="checkbox"><span>Labyrinthe animé</span><small>Le parcours reste décoché par défaut</small></label>
                <label v-if="siteSettings.background.showAmbient" class="backdrop-range-option"><span>Intensité du halo fixe <strong>{{ siteSettings.background.ambientIntensity }}%</strong></span><input v-model.number="siteSettings.background.ambientIntensity" type="range" min="0" max="100" step="5"></label>
                <label v-if="siteSettings.background.showMaze" class="backdrop-range-option"><span>Intensité du labyrinthe <strong>{{ siteSettings.background.mazeIntensity }}%</strong></span><input v-model.number="siteSettings.background.mazeIntensity" type="range" min="0" max="100" step="5"></label>
                <label v-if="siteSettings.background.showMaze" class="backdrop-range-option"><span>Vitesse du labyrinthe <strong>×{{ siteSettings.background.speed.toFixed(1) }}</strong></span><input v-model.number="siteSettings.background.speed" type="range" min="0.5" max="2" step="0.5"></label>
              </div>
            </section>
            <div class="field full"><button class="button" type="submit" :disabled="busy"><Save :size="14" /> Enregistrer les réglages</button></div>
          </form>
          <section class="window service-health-panel"><h2>État des services</h2><p class="muted">La vérification SMTP teste la connexion et l’authentification, sans envoyer de message. Aucun secret n’est affiché.</p><button class="button secondary" type="button" :disabled="busy" @click="checkServices">Vérifier maintenant</button><div v-if="serviceHealth" class="service-health-results"><span>Base : {{ serviceHealth.database }}</span><span>SMTP : {{ serviceHealth.smtp }}</span><span>Cloudinary : {{ serviceHealth.cloudinaryConfigured?'configuré':'non configuré' }}</span><small>Vérifié le {{ new Date(serviceHealth.checkedAt).toLocaleString('fr-FR') }}</small></div></section>
          <section class="window service-health-panel"><h2>Messages reçus</h2><p class="muted">La purge efface définitivement uniquement les messages plus anciens que la durée enregistrée.</p><button class="button danger" type="button" :disabled="busy" @click="purgeOldMessages">Purger les messages expirés</button><p v-if="purgeNotice" role="status">{{ purgeNotice }}</p></section>
        </template>
        <template v-else-if="activeTab==='analytics'">
          <p class="muted">Mesure agrégée par jour et par page, sans cookie, identifiant, adresse IP ni empreinte navigateur. Les pages détaillées de projet sont regroupées.</p>
          <button class="button secondary" type="button" @click="loadOperations">Actualiser</button>
          <div v-if="pageViewItems.length" class="analytics-table"><table class="admin-table"><thead><tr><th>Jour</th><th>Page</th><th>Visites</th></tr></thead><tbody><tr v-for="row in pageViewItems" :key="`${row.day}-${row.path}`"><td>{{ row.day }}</td><td>{{ row.path }}</td><td>{{ row.views }}</td></tr></tbody></table></div><div v-else class="admin-empty">Aucune visite mesurée pour les 30 derniers jours.</div>
        </template>
        <template v-else-if="activeTab==='activity'">
          <p class="muted">Journal des opérations sur les contenus. L’annulation n’est proposée que si aucune action plus récente ne concerne la même fiche.</p>
          <button class="button secondary" type="button" @click="loadOperations">Actualiser</button>
          <div v-if="activityItems.length" class="activity-log-list"><article v-for="item in activityItems" :key="item.id" class="activity-log-row"><div><strong>{{ item.summary }}</strong><small>{{ new Date(item.createdAt).toLocaleString('fr-FR') }} · {{ item.resource }}</small></div><button v-if="['create','update','delete'].includes(item.action)" class="button secondary" type="button" :disabled="busy" @click="undoActivity(item)">Annuler</button></article></div><div v-else class="admin-empty">Aucune opération enregistrée.</div>
        </template>
        <template v-else-if="activeTab==='cv'">
          <h2>Extraction de CV — aperçu privé</h2>
          <p class="muted">Choisis un PDF ou DOCX de 8 Mo maximum. Le fichier est traité en mémoire par le serveur, n’est pas envoyé à Cloudinary ni conservé en base. Les PDF scannés nécessitent un OCR, qui n’est pas activé.</p>
          <button class="button" type="button" :disabled="busy" @click="cvFileInput?.click()"><UploadCloud :size="15" />{{ busy?'Extraction en cours…':'Choisir un CV PDF ou DOCX' }}</button>
          <input ref="cvFileInput" class="upload-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change="previewCv">
          <section v-if="cvExtractedText" class="cv-preview window">
            <div class="eyebrow">Aperçu extrait · {{ cvFilename }}</div>
            <p class="muted">Vérifie et corrige le texte. Rien ne sera publié automatiquement : reporte manuellement les informations vérifiées dans le profil, le parcours ou les compétences.</p>
            <textarea v-model="cvExtractedText" rows="18" maxlength="40000" aria-label="Texte extrait du CV"></textarea>
          </section>
        </template>
        <template v-else-if="activeTab==='profile'">
          <div class="admin-alert">La photo envoyée sera stockée sur Cloudinary. N’envoie pas de fichier privé ou contenant des données personnelles sensibles.</div>
          <div class="field full" style="margin-bottom:16px">
            <label>Photo de profil</label>
            <div style="display:flex;gap:13px;align-items:center">
              <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="Photo de profil" style="width:74px;height:74px;object-fit:cover;border-radius:50%;border:1px solid var(--cyan)">
              <div v-else class="brand-mark" style="width:74px;height:74px;border-radius:50%"><ImagePlus :size="24" /></div>
              <button class="button secondary" type="button" :disabled="busy" @click="uploadInput?.click()"><Loader2 v-if="busy" :size="15" class="admin-spinner" /><UploadCloud v-else :size="15" />{{ busy?'Téléversement…':'Choisir une image' }}</button>
              <input ref="uploadInput" class="upload-input" type="file" accept="image/png,image/jpeg,image/webp" @change="uploadAvatar">
            </div>
          </div>
          <form class="admin-form" @submit.prevent="saveProfile">
            <div class="field"><label>Nom affiché</label><input v-model="profile.name" required maxlength="120"></div>
            <div class="field"><label>Intitulé</label><input v-model="profile.role" required maxlength="180"></div>
            <div class="field"><label>Localisation</label><input v-model="profile.location" maxlength="120"></div>
            <div class="field"><label>Formation</label><input v-model="profile.education" maxlength="180"></div>
            <div class="field full"><label>Présentation</label><textarea v-model="profile.bio" maxlength="3000"></textarea></div>
            <div class="field full"><label>E-mail de contact</label><input v-model="profile.email" type="email" maxlength="320"></div>
            <div class="field full">
              <div class="social-editor-heading">
                <label>Réseaux sociaux</label>
                <button class="button secondary" type="button" @click="addSocialLink"><Plus :size="14" /> Ajouter un réseau</button>
              </div>
              <p class="muted">Choisis un réseau et colle le lien vers ton profil, ou ajoute un réseau personnalisé avec son nom et son icône.</p>
              <button class="button secondary" type="button" @click="addCustomSocialLink"><Plus :size="14" /> Ajouter un réseau personnalisé</button>
              <div v-for="(link,index) in profile.socialLinks" :key="index" class="social-editor-row">
                <select v-model="link.platform" :aria-label="`Réseau social ${index+1}`">
                  <option v-for="network in socialNetworks" :key="network.id" :value="network.id" :disabled="profile.socialLinks.some((other,otherIndex)=>otherIndex!==index&&other.platform===network.id)">{{ network.label }}</option>
                  <option v-if="link.platform.startsWith('custom:')" :value="link.platform">Lien personnalisé</option>
                </select>
                <template v-if="link.platform.startsWith('custom:')"><input v-model="link.customLabel" required maxlength="80" placeholder="Nom du réseau"><input v-model="link.customIcon" maxlength="120" placeholder="logos:... ou text:"></template>
                <input v-model="link.url" type="url" maxlength="500" required :aria-label="`Lien ${socialNetworks.find(network=>network.id===link.platform)?.label||'social'} ${index+1}`" :placeholder="`https://${socialNetworks.find(network=>network.id===link.platform)?.id||'exemple'}.com/ton-profil`">
                <TechnologyIcon :name="link.customLabel||socialNetworks.find(network=>network.id===link.platform)?.label||link.platform" :icon="link.customIcon||socialNetworks.find(network=>network.id===link.platform)?.icon" size="22" />
                <button class="icon-button danger" type="button" :aria-label="`Supprimer ${socialNetworks.find(network=>network.id===link.platform)?.label||'ce réseau'}`" @click="removeSocialLink(index)"><Trash2 :size="15" /></button>
              </div>
              <p v-if="!profile.socialLinks.length" class="muted">Aucun réseau ajouté.</p>
            </div>
            <label class="field" style="display:flex;align-items:center;gap:8px"><input v-model="profile.available" type="checkbox" style="width:auto"> Ouvert aux opportunités</label>
            <div class="field full"><button class="button" type="submit" :disabled="busy"><Loader2 v-if="busy" :size="15" class="admin-spinner" /><Save v-else :size="15" />{{ busy?'Enregistrement…':'Enregistrer le profil' }}</button></div>
          </form>
        </template>
        <template v-else-if="activeTab==='messages'">
          <p class="muted">Le statut de traitement est indépendant du statut SMTP (envoyé, non envoyé ou échec). Recherche, suivi et archivage sont conservés en base.</p>
          <div class="message-filters"><input v-model="messageSearch" type="search" aria-label="Rechercher un message" placeholder="Rechercher nom, e-mail ou contenu"><select v-model="messageStatusFilter" aria-label="Filtrer les messages"><option value="all">Tous les messages actifs</option><option value="new">Nouveaux</option><option value="in_progress">En cours</option><option value="done">Traités</option><option value="archived">Archivés</option></select></div>
          <div v-if="filteredMessages.length" style="overflow-x:auto"><table class="admin-table"><thead><tr><th>De</th><th>Sujet &amp; message</th><th>Reçu / SMTP</th><th>Traitement</th><th>Action</th></tr></thead><tbody>
            <tr v-for="m in filteredMessages" :key="m.id">
              <td>{{ m.name }}<br><a :href="`mailto:${m.email}`" style="color:var(--cyan)">{{ m.email }}</a></td>
              <td><strong>{{ m.subject||'Sans sujet' }}</strong><br>{{ m.message }}</td>
              <td>{{ new Date(m.createdAt).toLocaleDateString('fr-FR') }}<br><small>{{ m.deliveryStatus }}</small></td>
              <td><select :value="m.processingStatus" aria-label="Statut de traitement" @change="updateMessage(m.id,{processingStatus:($event.target as HTMLSelectElement).value as 'new'|'in_progress'|'done'})"><option value="new">Nouveau</option><option value="in_progress">En cours</option><option value="done">Traité</option></select></td>
              <td><button class="button secondary" type="button" @click="updateMessage(m.id,{archived:!m.archivedAt})">{{ m.archivedAt?'Désarchiver':'Archiver' }}</button></td>
            </tr>
          </tbody></table></div>
          <div v-else class="admin-empty">Aucun message pour ce filtre.</div>
        </template>
      </main>
    </div>
    <div v-if="editorOpen" class="editor-overlay" @click.self="editorOpen=false">
      <section class="window editor-dialog">
        <div class="dialog-head"><h2>{{ editing?'Modifier':'Ajouter' }} · {{ tableTitle }}</h2><button class="icon-button" aria-label="Fermer" @click="editorOpen=false"><X :size="16" /></button></div>
        <form class="admin-form" @submit.prevent="saveRecord">
          <div v-if="['skills','technologies'].includes(resourceForTab())" class="icon-editor field full">
            <label>Icône de {{ resourceForTab()==='skills'?'la compétence':'la technologie' }}</label>
            <div class="icon-editor-preview"><TechnologyIcon :name="editor.name||'Technologie'" :icon="editor.icon" size="38" /><span>{{ editor.icon||'Choisis une icône ou saisis un texte' }}</span></div>
            <select v-model="iconKind" aria-label="Type d’icône"><option value="logo">Logo officiel (catalogue Iconify)</option><option value="text">Texte personnalisé</option><option value="image">URL d’image personnalisée</option></select>
            <p class="muted">Sélectionne une icône dans le catalogue au-dessus ou renseigne le logo (ex. <code>logos:python</code>), le texte (ex. <code>text:Py</code>) ou l’URL d’une image. Le texte ne remplace pas un logo : tu choisis explicitement le rendu.</p>
          </div>
          <div v-if="resourceForTab()==='projects'" class="field full">
            <ProjectGalleryEditor v-model="editor.gallery" v-model:cover-url="editor.imageUrl" @upload="chooseGalleryUpload" @upload-files="uploadGalleryFiles" />
            <input ref="galleryImageInput" class="upload-input" type="file" accept="image/png,image/jpeg,image/webp" multiple @change="uploadGalleryImages">
            <p v-if="galleryUploadStatus" class="upload-status field full" role="status"><Loader2 :size="15" class="admin-spinner" />{{ galleryUploadStatus }}</p>
          </div>
          <NuxtLink v-if="resourceForTab()==='projects'&&editor.slug&&editing?.id" class="button secondary field full" :to="`/admin/preview/projets/${editor.slug}`" target="_blank">Prévisualiser sans publier</NuxtLink>
          <template v-for="(value,key) in editor" :key="key">
            <div v-if="key==='tags'" class="field full"><label>Technologies (séparées par des virgules)</label><input v-model="editor[key]" placeholder="Nuxt, PostgreSQL, Tailwind"></div>
            <div v-else-if="key==='aiType'&&activeTab==='ai'" class="field"><label>Type IA</label><select :value="editor.aiType" @change="setAiType(($event.target as HTMLSelectElement).value)"><option value="provider">Fournisseur</option><option value="model">Modèle</option><option value="assistant">Assistant / application</option><option value="tool">Outil / framework</option></select></div>
            <div v-else-if="key==='aiProviderId'&&activeTab==='ai'&&editor.aiType!=='provider'" class="field"><label>Fournisseur associé</label><select v-model="editor.aiProviderId"><option :value="null">Non renseigné</option><option v-for="provider in aiProviders" :key="provider.id" :value="provider.id">{{ provider.name }}</option></select></div>
            <div v-else-if="key==='aiAccessMode'&&activeTab==='ai'" class="field"><label>Mode d’accès</label><select v-model="editor.aiAccessMode"><option value="web">Web</option><option value="api">API</option><option value="local">Local</option><option value="hybrid">Hybride</option><option value="other">Autre / non précisé</option></select></div>
            <div v-else-if="key==='aiUseCases'&&activeTab==='ai'" class="field full"><label>Usages vérifiés (séparés par des virgules)</label><input v-model="editor.aiUseCases" placeholder="Code, recherche, rédaction"></div>
            <div v-else-if="key==='aiVerifiedAt'&&activeTab==='ai'" class="field"><label>Date de vérification de l’information</label><input v-model="editor.aiVerifiedAt" type="date"></div>
            <div v-else-if="key==='officialUrl'&&activeTab==='ai'" class="field"><label>Lien officiel</label><input v-model="editor.officialUrl" type="url" placeholder="https://…"></div>
            <div v-else-if="['description','caseContext','outcomes','responsibilities','quote'].includes(String(key))" class="field full"><label>{{ ({description:'Description',caseContext:'Contexte & objectifs',outcomes:'Résultats (faits vérifiables)',responsibilities:'Responsabilités — une par ligne',quote:'Témoignage (citation exacte)'} as Record<string,string>)[String(key)] }}</label><textarea v-model="editor[key]" :maxlength="key==='quote'?2000:3000"></textarea></div>
            <div v-else-if="key==='metrics'&&activeTab==='projects'" class="field full"><label>Métriques vérifiables (JSON : label, value, context facultatif)</label><textarea v-model="editor.metrics" rows="5" placeholder='[{"label":"Délai","value":"3 semaines","context":"Du brief à la mise en ligne"}]'></textarea><small class="muted">Ne renseigne que des résultats exacts et que tu peux justifier.</small></div>
            <div v-else-if="key==='skills'&&activeTab==='certifications'" class="field"><label>Compétences associées (séparées par des virgules)</label><input v-model="editor[key]" placeholder="Cloud, sécurité, développement"></div>
            <div v-else-if="key==='imageUrl'&&['projects','journey','educations','certifications'].includes(activeTab)" class="field full"><label>{{ activeTab==='projects'?'Visuel principal du projet':activeTab==='certifications'?'Badge ou preuve visuelle':activeTab==='educations'?'Visuel de la formation':'Image du parcours' }}</label><div class="project-image-admin"><img v-if="editor.imageUrl" :src="editor.imageUrl" alt="Aperçu du visuel"><span v-else class="muted">Aucune image choisie</span><div><input v-model="editor.imageUrl" type="url" placeholder="URL de l’image"><button type="button" class="button secondary" :disabled="busy" @click="projectImageInput?.click()"><Loader2 v-if="busy" :size="14" class="admin-spinner" /><UploadCloud v-else :size="14" />{{ busy?'Envoi…':'Téléverser une image' }}</button><input ref="projectImageInput" class="upload-input" type="file" accept="image/png,image/jpeg,image/webp" @change="uploadProjectImage"><small class="muted">JPEG, PNG ou WebP · 8 Mo maximum</small></div></div></div>
            <div v-else-if="key==='status'&&activeTab==='educations'" class="field"><label>Statut</label><select v-model="editor[key]"><option value="completed">Diplôme obtenu</option><option value="in_progress">En cours</option></select></div>
            <div v-else-if="key==='featured'" class="field"><label style="display:flex;align-items:center;gap:8px"><input v-model="editor[key]" type="checkbox" style="width:auto"> Mis en avant</label></div>
            <div v-else-if="key==='permissionConfirmed'" class="field full"><label style="display:flex;align-items:flex-start;gap:8px"><input v-model="editor.permissionConfirmed" type="checkbox" style="width:auto;margin-top:4px"> Autorisation explicite de publier cette citation confirmée</label><small class="muted">Un témoignage sans autorisation reste un brouillon privé.</small></div>
            <div v-else-if="key==='publicationStatus'" class="field"><label>Publication</label><select v-model="editor[key]"><option value="draft">Brouillon (privé)</option><option value="published">Publié</option></select></div>
            <div v-else-if="key==='icon'" class="field"><label>Valeur de l’icône</label><input v-model="editor[key]" :placeholder="iconKind==='logo'?'logos:python':iconKind==='image'?'https://…/logo.svg':'text:Py'" maxlength="120"></div>
            <div v-else-if="key!=='id'&&key!=='gallery'&&!(key==='category'&&activeTab==='ai')" class="field"><label>{{ ({title:'Titre',slug:'Identifiant URL',demoUrl:'Lien du projet',repoUrl:'Lien du dépôt',imageUrl:'URL de l’image',year:'Année',projectType:'Type de projet',caseRole:'Rôle dans le projet',publishAt:'Publication différée',role:'Rôle / poste',author:'Nom de la personne',organization:'Établissement / organisation',institution:'Établissement',degree:'Diplôme ou niveau',issuer:'Organisme émetteur',issuedAt:'Date d’obtention',expiresAt:'Date d’expiration (facultative)',credentialId:'Identifiant du certificat',credentialUrl:'Lien de vérification',skills:'Compétences associées',status:'Statut',responsibilities:'Responsabilités',outcomes:'Résultats',location:'Lieu',startDate:'Début',endDate:'Fin',date:'Date',name:'Nom',level:'Niveau (%)',category:'Catégorie',sortOrder:'Ordre'} as Record<string,string>)[String(key)]||key }}</label><input v-model="editor[key]" :type="key==='publishAt'?'datetime-local':['demoUrl','repoUrl','imageUrl','credentialUrl','officialUrl'].includes(String(key))?'url':['level','sortOrder'].includes(String(key))?'number':'text'" :max="key==='level'?100:undefined" :min="key==='level'?0:undefined" :required="['title','name','slug','role','organization','institution','issuer','startDate','level','author'].includes(String(key))"></div>
          </template>
          <div class="field full" style="display:flex;justify-content:flex-end;gap:9px"><button type="button" class="button secondary" @click="editorOpen=false">Annuler</button><button type="submit" class="button" :disabled="busy"><Loader2 v-if="busy" :size="14" class="admin-spinner" /><Save v-else :size="14" />{{ busy?'Enregistrement…':'Enregistrer' }}</button></div>
        </form>
      </section>
    </div>
  </div></div>
</template>
