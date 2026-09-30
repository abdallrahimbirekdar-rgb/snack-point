package com.baladna.courier;
import android.app.*;
import android.content.Intent;
import android.location.*;
import android.os.*;
import org.json.*;
import java.util.concurrent.*;

public class TrackingService extends Service implements LocationListener {
 private LocationManager manager;
 private volatile Location latest;
 private ScheduledExecutorService sender;
 private static final int NOTIFICATION=10;
 @Override public void onCreate(){super.onCreate();NotificationManager notifications=getSystemService(NotificationManager.class);notifications.createNotificationChannel(new NotificationChannel("delivery","مشاركة موقع التوصيل",NotificationManager.IMPORTANCE_LOW));Intent stop=new Intent(this,TrackingService.class).setAction("STOP");PendingIntent stopAction=PendingIntent.getService(this,1,stop,PendingIntent.FLAG_IMMUTABLE);PendingIntent open=PendingIntent.getActivity(this,2,new Intent(this,MainActivity.class),PendingIntent.FLAG_IMMUTABLE);Notification notification=new Notification.Builder(this,"delivery").setContentTitle("مشاركة موقعك أثناء التوصيل").setContentText("اضغط لفتح الطلبات. يمكنك إيقاف المشاركة.").setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentIntent(open).setOngoing(true).addAction(new Notification.Action.Builder(null,"إيقاف",stopAction).build()).build();startForeground(NOTIFICATION,notification);
  manager=getSystemService(LocationManager.class);
  try{boolean provider=false;for(String p:new String[]{LocationManager.GPS_PROVIDER,LocationManager.NETWORK_PROVIDER})if(manager.isProviderEnabled(p)){manager.requestLocationUpdates(p,10000,10,this,Looper.getMainLooper());provider=true;}if(!provider){stopSelf();return;}}
  catch(SecurityException e){stopSelf();return;}
  sender=Executors.newSingleThreadScheduledExecutor();sender.scheduleWithFixedDelay(this::send,0,15,TimeUnit.SECONDS);
 }
 @Override public int onStartCommand(Intent intent,int flags,int startId){if(intent!=null&&"STOP".equals(intent.getAction()))stopSelf();return START_NOT_STICKY;}
 @Override public void onLocationChanged(Location location){latest=new Location(location);}
 private void send(){try{JSONArray orders=Api.call(this,"/courier/orders",null).getJSONArray("orders");boolean active=false;for(int i=0;i<orders.length();i++)if("out_for_delivery".equals(orders.getJSONObject(i).optString("status")))active=true;if(!active){stopSelf();return;}Location p=latest;if(p==null||SystemClock.elapsedRealtimeNanos()-p.getElapsedRealtimeNanos()>30000000000L)return;JSONObject response=Api.call(this,"/courier/location",new JSONObject().put("lat",p.getLatitude()).put("lng",p.getLongitude()).put("accuracy",p.getAccuracy()));if(!response.optBoolean("active"))stopSelf();}catch(Exception e){if(e.getMessage()!=null&&e.getMessage().startsWith("401:"))stopSelf();}}
 @Override public void onProviderEnabled(String provider){}
 @Override public void onProviderDisabled(String provider){}
 @Override public void onStatusChanged(String provider,int status,Bundle extras){}
 @Override public IBinder onBind(Intent intent){return null;}
 @Override public void onDestroy(){if(sender!=null)sender.shutdownNow();if(manager!=null)manager.removeUpdates(this);stopForeground(STOP_FOREGROUND_REMOVE);super.onDestroy();}
}
