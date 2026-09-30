package com.baladna.courier;
import android.content.Context;
import org.json.JSONObject;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;

final class Api {
 static JSONObject call(Context ctx,String path,JSONObject data) throws Exception {
  var prefs=ctx.getSharedPreferences("courier",0);
  String base=prefs.getString("url","");
  URI uri=new URI(base);
  if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getRawUserInfo()!=null||uri.getRawQuery()!=null||uri.getRawFragment()!=null||!(uri.getPath().isEmpty()||uri.getPath().equals("/")))throw new Exception("أدخل عنوان خدمة HTTPS صحيحًا دون مسار إضافي.");
  HttpURLConnection connection=(HttpURLConnection)new URI(base.replaceAll("/$","")+path).toURL().openConnection();
  try {
   connection.setConnectTimeout(10000);connection.setReadTimeout(10000);connection.setInstanceFollowRedirects(false);
   connection.setRequestProperty("Authorization","Bearer "+prefs.getString("key",""));
   if(data!=null){connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");try(var out=connection.getOutputStream()){out.write(data.toString().getBytes(StandardCharsets.UTF_8));}}
   int code=connection.getResponseCode();
   if(code==401)throw new Exception("401: حساب المندوب غير صالح أو موقوف.");
   if(code<200||code>=300)throw new Exception("تعذّر تنفيذ الطلب: "+code);
   try(var in=connection.getInputStream();var buffer=new java.io.ByteArrayOutputStream()){byte[] chunk=new byte[4096];int count;while((count=in.read(chunk))!=-1){buffer.write(chunk,0,count);if(buffer.size()>100000)throw new Exception("Response too large");}return new JSONObject(new String(buffer.toByteArray(),StandardCharsets.UTF_8));}
  }finally{connection.disconnect();}
 }
}
