package com.baladna.market;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.webkit.*;
import android.widget.*;
import android.view.View;

public class MainActivity extends Activity {
 private WebView web; private ProgressBar progress; private LinearLayout error; private boolean failed;
 private final String home="https://abdallrahimbirekdar-rgb.github.io/snack-point/";
 @Override public void onCreate(Bundle state){super.onCreate(state);
 LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.WHITE);
 if(android.os.Build.VERSION.SDK_INT>=35)root.setOnApplyWindowInsetsListener((v,i)->{android.graphics.Insets s=i.getInsets(android.view.WindowInsets.Type.systemBars());v.setPadding(s.left,s.top,s.right,s.bottom);return i;});
 LinearLayout bar=new LinearLayout(this);bar.setPadding(12,8,12,8);bar.setBackgroundColor(Color.rgb(10,58,48));
 TextView title=new TextView(this);title.setText("ماركت بلدنا");title.setTextColor(Color.WHITE);title.setTextSize(22);bar.addView(title,new LinearLayout.LayoutParams(0,-2,1));
 Button reload=new Button(this);reload.setText("تحديث");reload.setOnClickListener(v->web.reload());bar.addView(reload);root.addView(bar);
 progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);root.addView(progress,new LinearLayout.LayoutParams(-1,5));
 error=new LinearLayout(this);error.setOrientation(LinearLayout.VERTICAL);error.setPadding(24,36,24,24);TextView text=new TextView(this);text.setText("تعذّر فتح الموقع. تأكد من اتصال الإنترنت ثم حاول مجددًا.");text.setTextSize(20);error.addView(text);Button retry=new Button(this);retry.setText("إعادة المحاولة");retry.setOnClickListener(v->web.reload());error.addView(retry);error.setVisibility(View.GONE);root.addView(error);
 web=new WebView(this);root.addView(web,new LinearLayout.LayoutParams(-1,0,1));setContentView(root);
 WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
 web.setWebChromeClient(new WebChromeClient(){public void onProgressChanged(WebView w,int n){progress.setProgress(n);progress.setVisibility(n==100?View.GONE:View.VISIBLE);}});
 web.setWebViewClient(new WebViewClient(){
 public boolean shouldOverrideUrlLoading(WebView w,WebResourceRequest r){if(!r.isForMainFrame())return false;Uri u=r.getUrl();if("https".equals(u.getScheme())&&"abdallrahimbirekdar-rgb.github.io".equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/snack-point/"))return false;
 if("https".equals(u.getScheme())||"http".equals(u.getScheme())||"whatsapp".equals(u.getScheme())||"tel".equals(u.getScheme())||"mailto".equals(u.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){Toast.makeText(MainActivity.this,"لا يوجد تطبيق لفتح هذا الرابط",Toast.LENGTH_LONG).show();}}return true;}
 public void onPageStarted(WebView w,String u,android.graphics.Bitmap b){failed=false;error.setVisibility(View.GONE);web.setVisibility(View.VISIBLE);}
 public void onReceivedError(WebView w,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame()){failed=true;error.setVisibility(View.VISIBLE);web.setVisibility(View.GONE);}}
 public void onReceivedHttpError(WebView w,WebResourceRequest r,WebResourceResponse e){if(r.isForMainFrame()&&e.getStatusCode()>=400){failed=true;error.setVisibility(View.VISIBLE);web.setVisibility(View.GONE);}}
 });if(state==null||web.restoreState(state)==null)web.loadUrl(home);
 }
 @Override public void onSaveInstanceState(Bundle b){web.saveState(b);super.onSaveInstanceState(b);}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override public void onDestroy(){web.destroy();super.onDestroy();}
}