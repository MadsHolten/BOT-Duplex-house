import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule }   from '@angular/forms';

// App cmponents
import { AppComponent } from './app.component';

// Import 2D and 3D BOT viewer
import { PlanModule } from 'ng-plan';
import { MeshViewerModule } from 'ng-mesh-viewer';

// Angular material
import {  MatButtonModule, 
          MatSelectModule,
          MatRadioModule } from '@angular/material';

// Ather 3rd party libraries
import { AngularDraggableModule } from 'angular2-draggable';
import { MarkdownToHtmlModule } from 'markdown-to-html-pipe';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    PlanModule,
    MeshViewerModule,
    AngularDraggableModule,
    MarkdownToHtmlModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
