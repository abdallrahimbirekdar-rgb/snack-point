package com.baladna.courier;
import android.Manifest;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.text.InputType;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.widget.*;
import android.view.View;
import org.json.*;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
 private LinearLayout content,orders; private TextView message,count,sharing; private ProgressBar progress;
 private final java.util.concurrent.ExecutorService worker=Executors.newSingleThreadExecutor();
 private final Handler handler=new Handler(Looper.getMainLooper()); private boolean busy=false,alive=true;
 private final int green=Color.rgb(12,65,53),gold=Color.rgb(194,143,47);
 private final Runnable ticker=new Runnable(){public void run(){if(alive){refresh(false);handler.postDelayed(this,15000);}}};
 private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density);}
 private GradientDrawable bg(int color,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;}
 private TextView text(String value,int size,int color){TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);t.setPadding(0,dp(8),0,dp(8));return t;}
 @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().setStatusBarColor(green);
 ScrollView scroll=new ScrollView(this);scroll.setBackgroundColor(Color.rgb(241,245,242));content=new LinearLayout(this);content.setOrientation(1);content.setPadding(dp(18),dp(20),dp(18),dp(24));content.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);scroll.addView(content);setContentView(scroll);
 if(Build.VERSION.SDK_INT>=35)scroll.setOnApplyWindowInsetsListener((v,i)->{android.graphics.Insets s=i.getInsets(android.view.WindowInsets.Type.systemBars());v.setPadding(s.left,s.top,s.right,s.bottom);return i;});
 TextView title=text("مندوب بلدنا",30,green);title.setTypeface(null,Typeface.BOLD);content.addView(title);content.addView(text("طلباتك وخطوات التوصيل في مكان واحد",16,Color.DKGRAY));
 LinearLayout tools=new LinearLayout(this);content.addView(tools);button(tools,"تحديث",()->refresh(true),green,true);button(tools,"إعدادات الحساب",this::settings,gold,true);
 progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setIndeterminate(true);progress.setVisibility(View.GONE);content.addView(progress);
 message=text("",16,green);content.addView(message);count=text("الطلبات الحالية",21,green);content.addView(count);
 orders=new LinearLayout(this);orders.setOrientation(1);content.addView(orders);
 sharing=text("",15,Color.DKGRAY);content.addView(sharing);
 button(content,"إيقاف مشاركة الموقع",()->new AlertDialog.Builder(this).setTitle("إيقاف مشاركة الموقع؟").setMessage("لن يرى الزبون تحديثات موقعك حتى تستأنف المشاركة. حالة الطلب لن تتغير.").setPositiveButton("إيقاف",(d,w)->{stopService(new Intent(this,TrackingService.class));sharing.setText("أوقفت مشاركة الموقع يدويًا.");}).setNegativeButton("رجوع",null).show(),Color.rgb(120,58,48),false);
 content.addView(text("ابدأ التوصيل والتطبيق مفتوح، ثم يمكنك قفل الشاشة. يلزم الإنترنت والموقع الدقيق. بعد الوصول تختفي الخريطة عن الزبون.",14,Color.DKGRAY));
 var prefs=getSharedPreferences("courier",0);if(prefs.getString("url","").isEmpty())prefs.edit().putString("url","https://baladna-delivery.abdallrahim-birekdar.workers.dev").apply();
 if(prefs.getString("key","").isEmpty()){message.setText("مرحبًا! افتح إعدادات الحساب وأدخل مفتاح المندوب للبدء.");settings();}
 }
 private void button(LinearLayout parent,String label,Runnable action,int color,boolean weighted){Button b=new Button(this);b.setText(label);b.setTextSize(17);b.setTextColor(Color.WHITE);b.setAllCaps(false);b.setBackground(bg(color,12));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(weighted?0:-1,dp(54),weighted?1:0);lp.setMargins(dp(3),dp(6),dp(3),dp(6));parent.addView(b,lp);b.setOnClickListener(v->action.run());}
 private void settings(){var prefs=getSharedPreferences("courier",0);LinearLayout box=new LinearLayout(this);box.setOrientation(1);box.setPadding(dp(22),dp(12),dp(22),dp(12));box.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
 box.addView(text("أدخل المفتاح الذي أعطاك إياه صاحب الماركت. تحتاج هذه الخطوة مرة واحدة فقط.",16,green));
 EditText key=new EditText(this);key.setHint("مفتاح المندوب");key.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);key.setText(prefs.getString("key",""));box.addView(key);
 box.addView(text("عنوان خدمة التوصيل جاهز؛ غيّره فقط إذا طلب منك صاحب الماركت.",13,Color.DKGRAY));EditText url=new EditText(this);url.setSingleLine(true);url.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);url.setText(prefs.getString("url",""));box.addView(url);
 AlertDialog dialog=new AlertDialog.Builder(this).setTitle("إعدادات المندوب").setView(box).setPositiveButton("حفظ واتصال",null).setNegativeButton("رجوع",null).create();dialog.setOnShowListener(d->dialog.getButton(-1).setOnClickListener(v->{if(busy)return;String k=key.getText().toString().trim(),u=url.getText().toString().trim();try{java.net.URI parsed=new java.net.URI(u);if(k.isEmpty()||!"https".equals(parsed.getScheme())||parsed.getHost()==null||parsed.getRawUserInfo()!=null||parsed.getRawQuery()!=null||parsed.getRawFragment()!=null||!(parsed.getPath().isEmpty()||parsed.getPath().equals("/")))throw new Exception();}catch(Exception e){key.setError("أدخل مفتاحًا وعنوان HTTPS صحيحًا");return;}stopService(new Intent(this,TrackingService.class));prefs.edit().putString("key",k).putString("url",u).apply();dialog.dismiss();refresh(true);}));dialog.show();}
 private boolean locationAllowed(){if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},1);message.setText("اسمح بالموقع الدقيق ثم اضغط بدء التوصيل مجددًا.");return false;}if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},2);return true;}
 private void startSharing(){try{startForegroundService(new Intent(this,TrackingService.class));sharing.setText("طُلب تشغيل مشاركة الموقع. تحقق من ظهور إشعار التتبّع على الهاتف.");}catch(Exception e){sharing.setText("تعذّر تشغيل التتبّع. افتح التطبيق واضغط استئناف مشاركة الموقع.");}}
 private void refresh(boolean manual){if(busy||!alive||getSharedPreferences("courier",0).getString("key","").isEmpty())return;busy=true;if(manual)message.setText("جارٍ تحديث الطلبات…");progress.setVisibility(View.VISIBLE);worker.execute(()->{try{JSONArray list=Api.call(this,"/courier/orders",null).getJSONArray("orders");runOnUiThread(()->{if(!alive)return;orders.removeAllViews();count.setText("طلباتك الحالية: "+list.length());boolean active=false;
 for(int i=0;i<list.length();i++){JSONObject o=list.optJSONObject(i);if(o==null)continue;String id=o.optString("id"),status=o.optString("status");if(status.equals("out_for_delivery"))active=true;
 LinearLayout card=new LinearLayout(this);card.setOrientation(1);card.setPadding(dp(16),dp(12),dp(16),dp(12));card.setBackground(bg(Color.WHITE,18));card.setElevation(dp(2));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(8),0,dp(10));orders.addView(card,cp);
 TextView badge=text(statusLabel(status),18,green);badge.setTypeface(null,Typeface.BOLD);card.addView(badge);TextView number=text(id,15,Color.DKGRAY);number.setTextIsSelectable(true);card.addView(number);
 String next=status.equals("preparing")?"out_for_delivery":status.equals("out_for_delivery")?"arrived":"delivered";
 card.addView(text(next.equals("out_for_delivery")?"ابدأ عند مغادرتك بالطلب.":next.equals("arrived")?"اضغط وصلت عندما تصل إلى الزبون.":"أكد التسليم بعد إعطاء الطلب للزبون.",15,Color.DKGRAY));
 button(card,actionLabel(next),()->confirm(id,next),green,false);if(status.equals("out_for_delivery"))button(card,"استئناف مشاركة الموقع",()->{if(locationAllowed())startSharing();},gold,false);
 }
 if(list.length()==0)orders.addView(text("لا توجد طلبات حاليًا\nسيظهر الطلب هنا عندما يعيّنه صاحب الماركت لك.",19,Color.DKGRAY));
 if(!active){stopService(new Intent(this,TrackingService.class));sharing.setText("لا توجد رحلة نشطة؛ مشاركة الموقع متوقفة.");}
 message.setText("آخر تحديث: "+new java.text.SimpleDateFormat("HH:mm:ss",java.util.Locale.getDefault()).format(new java.util.Date()));busy=false;progress.setVisibility(View.GONE);
 });}catch(Exception e){runOnUiThread(()->{if(!alive)return;message.setText(e.getMessage()!=null&&e.getMessage().startsWith("401")?"مفتاح المندوب غير صحيح أو الحساب موقوف. راجع إعدادات الحساب.":"تعذّر الاتصال. تحقق من الإنترنت ثم اضغط تحديث. الطلبات المعروضة قديمة.");busy=false;progress.setVisibility(View.GONE);});}});}
 private String statusLabel(String s){return switch(s){case "preparing"->"● جاهز لبدء التوصيل";case "out_for_delivery"->"● في الطريق إلى الزبون";case "arrived"->"● وصلت — بانتظار التسليم";default->s;};}
 private String actionLabel(String s){return switch(s){case "out_for_delivery"->"بدء التوصيل";case "arrived"->"وصلت إلى الزبون";default->"تأكيد تسليم الطلب";};}
 private void confirm(String id,String status){if(busy)return;new AlertDialog.Builder(this).setTitle(actionLabel(status)).setMessage(status.equals("out_for_delivery")?"سيتم إرسال موقع هاتفك إلى خدمة بلدنا على Cloudflare، ليظهر للزبون صاحب الطلب أثناء التوصيل. ابدأ الآن؟":status.equals("arrived")?"هل وصلت إلى الزبون؟ ستظهر رسالة الوصول في صفحة تتبّع الطلب.":"هل سلّمت الطلب للزبون؟").setPositiveButton("تأكيد",(d,w)->update(id,status)).setNegativeButton("رجوع",null).show();}
 private void update(String id,String status){if(busy)return;if(status.equals("out_for_delivery")&&!locationAllowed())return;busy=true;progress.setVisibility(View.VISIBLE);worker.execute(()->{try{Api.call(this,"/courier/status",new JSONObject().put("id",id).put("status",status));runOnUiThread(()->{if(!alive)return;busy=false;if(status.equals("out_for_delivery"))startSharing();refresh(true);});}catch(Exception e){runOnUiThread(()->{if(!alive)return;busy=false;progress.setVisibility(View.GONE);message.setText("لم تُحفظ الخطوة. تحقق من الاتصال وحدّث الطلبات قبل المحاولة مجددًا.");});}});}
 @Override public void onResume(){super.onResume();handler.removeCallbacks(ticker);refresh(false);handler.postDelayed(ticker,15000);}
 @Override public void onPause(){handler.removeCallbacks(ticker);super.onPause();}
 @Override public void onDestroy(){alive=false;handler.removeCallbacks(ticker);worker.shutdown();super.onDestroy();}
}
