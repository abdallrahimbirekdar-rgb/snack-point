package com.baladna.courier;
import android.Manifest;
import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.text.InputType;
import android.widget.*;
import android.view.View;
import org.json.*;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
 private LinearLayout content,orders;
 private TextView message;
 private final java.util.concurrent.ExecutorService worker=Executors.newSingleThreadExecutor();
 private boolean busy=false;
 @Override public void onCreate(Bundle state){super.onCreate(state);ScrollView scroll=new ScrollView(this);content=new LinearLayout(this);content.setOrientation(LinearLayout.VERTICAL);content.setPadding(28,40,28,28);content.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);scroll.addView(content);setContentView(scroll);TextView title=new TextView(this);title.setText("مندوب ماركت بلدنا");title.setTextSize(25);content.addView(title);
  message=new TextView(this);message.setPadding(0,20,0,20);content.addView(message);
  var prefs=getSharedPreferences("courier",0);
  EditText url=new EditText(this);url.setHint("عنوان خدمة التوصيل https://…");url.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);url.setText(prefs.getString("url",""));content.addView(url);
  EditText key=new EditText(this);key.setHint("مفتاح المندوب");key.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);key.setText(prefs.getString("key",""));content.addView(key);
  button(content,"حفظ الحساب وتحديث الطلبات",()->{if(busy)return;stopService(new Intent(this,TrackingService.class));prefs.edit().putString("url",url.getText().toString().trim()).putString("key",key.getText().toString().trim()).apply();refresh();});
  button(content,"تحديث الطلبات",this::refresh);
  button(content,"إيقاف مشاركة الموقع",()->{stopService(new Intent(this,TrackingService.class));message.setText("أُوقفت مشاركة الموقع. الطلب يبقى جارياً حتى تحديث حالته.");});
  TextView help=new TextView(this);help.setText("ابدأ التوصيل والتطبيق مفتوح. سيظهر إشعار مشاركة الموقع ويمكن بعدها قفل الشاشة. تتوقف المشاركة عند إتمام الطلبات. يلزم إنترنت وGPS؛ لا توقف التطبيق إجباريًا أثناء الرحلة.");content.addView(help);
  orders=new LinearLayout(this);orders.setOrientation(LinearLayout.VERTICAL);content.addView(orders);if(!prefs.getString("key","").isEmpty())refresh();
 }
 private void button(LinearLayout parent,String text,Runnable action){Button b=new Button(this);b.setText(text);b.setOnClickListener(v->action.run());parent.addView(b);}
 private boolean locationAllowed(){if(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},1);message.setText("اسمح بالموقع الدقيق ثم اضغط بدء التوصيل مجددًا.");return false;}if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},2);}return true;}
 private void refresh(){if(busy)return;busy=true;message.setText("جارٍ تحديث الطلبات…");worker.execute(()->{try{JSONArray list=Api.call(this,"/courier/orders",null).getJSONArray("orders");runOnUiThread(()->{orders.removeAllViews();for(int i=0;i<list.length();i++){JSONObject order=list.optJSONObject(i);if(order==null)continue;String id=order.optString("id"),status=order.optString("status");TextView label=new TextView(this);label.setText(id+" — "+label(status));label.setTextSize(19);orders.addView(label);String next=status.equals("preparing")?"out_for_delivery":status.equals("out_for_delivery")?"arrived":"delivered";button(orders,label(next),()->update(id,next));if(status.equals("out_for_delivery"))button(orders,"استئناف مشاركة الموقع",()->{if(locationAllowed()){startForegroundService(new Intent(this,TrackingService.class));message.setText("تم استئناف مشاركة الموقع.");}});}message.setText(list.length()==0?"لا توجد طلبات معيّنة لك.":"تم تحديث الطلبات.");busy=false;});}catch(Exception e){runOnUiThread(()->{message.setText(e.getMessage());busy=false;});}});}
 private String label(String status){return switch(status){case "preparing"->"قيد التحضير";case "out_for_delivery"->"بدء التوصيل";case "arrived"->"وصلت";case "delivered"->"تم التسليم";default->status;};}
 private void update(String id,String status){if(busy)return;if(status.equals("out_for_delivery")&&!locationAllowed())return;busy=true;worker.execute(()->{try{Api.call(this,"/courier/status",new JSONObject().put("id",id).put("status",status));runOnUiThread(()->{busy=false;if(status.equals("out_for_delivery")){try{startForegroundService(new Intent(this,TrackingService.class));}catch(Exception e){message.setText("حُدّث الطلب لكن تعذّر بدء الموقع. اضغط استئناف المشاركة.");}}refresh();});}catch(Exception e){runOnUiThread(()->{busy=false;message.setText(e.getMessage());});}});}
 @Override public void onDestroy(){worker.shutdown();super.onDestroy();}
}
