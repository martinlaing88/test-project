import { NgModule } from "@angular/core";
import { UsersComponent } from "./components/users.component";
import { CommonModule } from "@angular/common";

@NgModule({
  declarations: [
    UsersComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    UsersComponent
  ],
})
export class UsersModule { }
