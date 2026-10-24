import { createError, defineEventHandler, readMultipartFormData } from 'h3';
import { useRuntimeConfig } from '#imports';
import { v2 as cloudinary } from 'cloudinary';
import { requireAdmin } from '~/server/utils/auth';
export default defineEventHandler(async(event)=>{
  await requireAdmin(event);const config=useRuntimeConfig();
  if(!config.cloudinaryCloudName||!config.cloudinaryApiKey||!config.cloudinaryApiSecret)throw createError({statusCode:503,statusMessage:'Cloudinary n’est pas configuré. Aucun fichier n’a été envoyé.'});
  const parts=await readMultipartFormData(event);const file=parts?.find(part=>part.name==='file'&&part.data);
  if(!file)throw createError({statusCode:400,statusMessage:'Sélectionne une image à envoyer.'});
  const requestedFolder=parts?.find(part=>part.name==='folder')?.data.toString('utf8')||'profile';
  if(!['profile','projects','journey'].includes(requestedFolder))throw createError({statusCode:400,statusMessage:'Dossier de destination invalide.'});
  const allowed=['image/jpeg','image/png','image/webp'];if(!file.type||!allowed.includes(file.type))throw createError({statusCode:415,statusMessage:'Format accepté : JPEG, PNG ou WebP.'});
  if(file.data.length>8*1024*1024)throw createError({statusCode:413,statusMessage:'L’image doit faire moins de 8 Mo.'});
  cloudinary.config({cloud_name:String(config.cloudinaryCloudName),api_key:String(config.cloudinaryApiKey),api_secret:String(config.cloudinaryApiSecret),secure:true});
  const transformation=requestedFolder==='profile'?[{width:900,height:900,crop:'limit',quality:'auto',fetch_format:'auto'}]:[{width:1600,height:1200,crop:'limit',quality:'auto',fetch_format:'auto'}];
  const uploaded=await new Promise<{secure_url:string}>((resolve,reject)=>{const stream=cloudinary.uploader.upload_stream({folder:`carrelfolio/${requestedFolder}`,resource_type:'image',allowed_formats:['jpg','png','webp'],transformation},(error,result)=>{if(error||!result)return reject(error||new Error('Upload Cloudinary échoué.'));resolve(result);});stream.end(file.data);});
  return{url:uploaded.secure_url};
});
