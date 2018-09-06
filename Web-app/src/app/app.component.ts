import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [ AppService ]
})
export class AppComponent implements OnInit {

  public query;
  public data;
  public selectedSpaces;
  public buttons = ["ng-plan", "ng-mesh-viewer"];
  public selectedButton = "ng-plan";

  public levels;
  public selectedLevel;

  public mode3D: string = "1";

  public msg: string;
  public showInfo: boolean = true;

  constructor(
    private http: HttpClient,
    private _s: AppService
  ) { }

  ngOnInit(){
    this.getLevels();
    this.switchModule("ng-plan");
  }

  getLevels(){
    this._s.getLevels().subscribe(res => {
      this.onLevelChange(res.data[0]);
      this.levels = res.data;
      this.query = res.query;
    }, err => console.log(err));
  }

  onLevelChange(level){
    if(level) this.selectedLevel = level;

    this._s.getRooms2D(this.selectedLevel.uri.value).subscribe(res => {
      this.query = res.query;
      this.data = res.data;
    }, err => console.log(err));
  }

  on3DModeChange(){
    this.msg = null;

    // Get spaces
    if(this.mode3D == "1"){
      this.msg = "Click space to get adjacent elements";

      this._s.getRooms3D().subscribe(res => {
        this.data = res.data;
        this.query = res.query;
      }, err => console.log(err));
    }

    // Get windows
    if(this.mode3D == "2"){
      this._s.getWindows3D().subscribe(res => {
        this.data = res.data;
        this.query = res.query;
      }, err => console.log(err));
    }

    // Get elements
    if(this.mode3D == "3"){
      this._s.getElements3D().subscribe(res => {
        this.data = res.data;
        this.query = res.query;
        console.log(res);
      }, err => console.log(err));
    }

    // Get contained in space
    if(this.mode3D == "4"){
      this._s.getContainedIn3D().subscribe(res => {
        this.data = res.data;
        this.query = res.query;
      }, err => console.log(err));
    }
  }

  switchModule(name){

    this.selectedButton = name;

    if(name == "ng-plan"){
      this.onLevelChange(null);
      this.msg = null;
    }

    if(name == "ng-mesh-viewer"){
      this.on3DModeChange();
    }

  }

  roomClick(ev){
    this.selectedSpaces = [ev.uri];
  }

  log(ev){
    var uri = ev.uri;
    console.log(uri);

    this._s.getType(uri).subscribe(res => {
      if(res == "Space"){
        this._s.getAdjElements(uri).subscribe(res => {
          this.data = res.data;
          this.query = res.query;
        }, err => console.log(err));
      }else{
        this.switchModule("ng-mesh-viewer");
      }
    }, err => console.log(err));

    
  }

  canvasClick(){
    this.selectedSpaces = [];
  }

}