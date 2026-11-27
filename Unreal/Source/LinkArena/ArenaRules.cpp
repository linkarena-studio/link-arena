#include "ArenaRules.h"
FString FArenaRules::Name(int32 T){
 static const TCHAR* Names[]={TEXT("ただのカード"),TEXT("ドロー1"),TEXT("リバース"),TEXT("突風"),TEXT("救済"),TEXT("ミミック"),TEXT("鍛冶屋"),TEXT("プレゼント"),TEXT("シールド"),TEXT("カオスワールド"),TEXT("ドロー2"),TEXT("アンコール"),TEXT("ドロー3"),TEXT("盗賊"),TEXT("リペア"),TEXT("全員ドロー"),TEXT("ハンドチェンジ")};
 return T>=0&&T<17?Names[T]:TEXT("");
}
FString FArenaRules::Description(int32 T){
 static const TCHAR* Descs[]={TEXT("凹凸を合わせて出す"),TEXT("次の人が1枚引く"),TEXT("進行方向を反転"),TEXT("相手の手番を飛ばす"),TEXT("手札を1枚捨てる"),TEXT("接続万能"),TEXT("手札を山札と交換"),TEXT("次の人に1枚渡す"),TEXT("ドロー攻撃を1回防ぐ"),TEXT("全員の手札の凹凸を変更"),TEXT("次の人が2枚引く"),TEXT("もう一度自分の番"),TEXT("次の人が3枚引く"),TEXT("相手から1枚奪う"),TEXT("カードの接続口を修理"),TEXT("他の全員が1枚引く"),TEXT("相手と手札を交換")};
 return T>=0&&T<17?Descs[T]:TEXT("");
}
FArenaCard FArenaRules::NewCard(){return {NextId++,FMath::RandRange(0,16),FMath::RandRange(1,7),FMath::RandRange(1,7),FMath::RandRange(0,4)};}
void FArenaRules::Start(){
 *this=FArenaRules();Players.SetNum(4);
 for(auto& P:Players)for(int32 I=0;I<7;++I)P.Hand.Add(NewCard());
 Board.Add(NewCard());LastId=Board[0].Id;
 Players[0].Hand[0].Left=Board[0].Right;Players[0].Hand[0].Type=0;
 Log=TEXT("あなたの番です。");
}
int32 FArenaRules::VisibleStart() const{
 if(Board.Num()<=3)return 0;
 int32 Index=Board.IndexOfByPredicate([this](const FArenaCard& C){return C.Id==LastId;});
 return FMath::Clamp(Index-(bLastLeft?0:2),0,Board.Num()-3);
}
bool FArenaRules::CanPlay(const FArenaCard& C,bool Left) const{
 if(Board.IsEmpty()||C.Type==5)return true;
 const int32 S=VisibleStart();const auto& L=Board[S];const auto& R=Board[S+VisibleCount()-1];
 return Left?(C.Right&L.Left)==C.Right:(R.Right&C.Left)==R.Right;
}
void FArenaRules::Attack(int32 P,int32 N){
 if(Players[P].Shield){Players[P].Shield=false;Log+=Person(P)+TEXT("が防御。 ");return;}
 for(int32 I=0;I<N;++I)Players[P].Hand.Add(NewCard());
 Log+=Person(P)+FString::Printf(TEXT("が%d枚引きました。 "),N);
}
void FArenaRules::FinishTurn(){
 Pending=INDEX_NONE;
 for(int32 I=0;I<Players.Num();++I)if(Players[I].Hand.IsEmpty()){Winner=I;Log+=Person(I)+TEXT("の勝利！");return;}
 if(bBonus){bBonus=false;return;}
 Turn=Next();if(Turn==Skip){Skip=INDEX_NONE;Turn=Next();}
}
bool FArenaRules::Play(int32 Index,bool Left){
 if(Winner!=INDEX_NONE||Pending!=INDEX_NONE||!Players.IsValidIndex(Turn)||!Players[Turn].Hand.IsValidIndex(Index))return false;
 FArenaCard C=Players[Turn].Hand[Index];if(!CanPlay(C,Left))return false;
 int32 S=VisibleStart();const auto L=Board[S],R=Board[S+VisibleCount()-1];
 Players[Turn].Hand.RemoveAt(Index);
 if(C.Type==5){if(Left)C.Right=L.Left;else C.Left=R.Right;}
 Board.Insert(C,Left?S:S+VisibleCount());LastId=C.Id;bLastLeft=Left;
 Log=Person(Turn)+TEXT("：")+Name(C.Type)+TEXT("。 ");
 int32 N=Next();
 switch(C.Type){
 case 1:Attack(N,1);break;case 10:Attack(N,2);break;case 12:Attack(N,3);break;
 case 2:Direction=-Direction;Log+=TEXT("順番を反転。");break;
 case 8:Players[Turn].Shield=true;Log+=TEXT("シールドを獲得。");break;
 case 9:for(auto& P:Players)for(auto& H:P.Hand){H.Left=FMath::RandRange(1,7);H.Right=FMath::RandRange(1,7);}Log+=TEXT("全員の凹凸が変化。");break;
 case 11:bBonus=true;break;
 case 15:for(int32 I=0;I<Players.Num();++I)if(I!=Turn)Attack(I,1);break;
 case 3:case 4:case 6:case 7:case 13:case 14:case 16:
  if(!Players[Turn].Hand.IsEmpty()){Pending=C.Type;return true;}break;
 default:break;
 }
 FinishTurn();return true;
}
bool FArenaRules::IsValidChoice(int32 I) const{
 if(Pending==INDEX_NONE)return false;
 return IsHandChoice()?Players[Turn].Hand.IsValidIndex(I):Players.IsValidIndex(I)&&I!=Turn&&(Pending!=13||!Players[I].Hand.IsEmpty());
}
bool FArenaRules::Choose(int32 I){
 if(!IsValidChoice(I))return false;
 auto& H=Players[Turn].Hand;
 switch(Pending){
 case 3:Skip=I;Log+=Person(I)+TEXT("の手番を飛ばします。");break;
 case 4:H.RemoveAt(I);Log+=TEXT("手札から1枚捨てました。");break;
 case 6:H.RemoveAt(I);H.Add(NewCard());Log+=TEXT("手札を1枚交換しました。");break;
 case 7:Players[Next()].Hand.Add(H[I]);H.RemoveAt(I);Log+=TEXT("カードを1枚渡しました。");break;
 case 13:{auto& O=Players[I].Hand;int32 J=FMath::RandRange(0,O.Num()-1);H.Add(O[J]);O.RemoveAt(J);Log+=Person(I)+TEXT("から1枚奪いました。");break;}
 case 14:{int32 S=VisibleStart();H[I].Left=Board[S+VisibleCount()-1].Right;H[I].Right=Board[S].Left;Log+=TEXT("カード1枚をリペアしました。");break;}
 case 16:Swap(H,Players[I].Hand);Log+=Person(I)+TEXT("と手札を交換しました。");break;
 default:return false;
 }
 FinishTurn();return true;
}
bool FArenaRules::Draw(){if(Winner!=INDEX_NONE||Pending!=INDEX_NONE||Players.IsEmpty())return false;Players[Turn].Hand.Add(NewCard());Log=Person(Turn)+TEXT("が山札から1枚引きました。");FinishTurn();return true;}
void FArenaRules::CpuMove(){
 if(Turn==0||Winner!=INDEX_NONE)return;
 if(Pending==INDEX_NONE){
  int32 Index=Players[Turn].Hand.IndexOfByPredicate([this](const FArenaCard& C){return CanPlay(C,false);});
  bool Left=false;if(Index==INDEX_NONE){Left=true;Index=Players[Turn].Hand.IndexOfByPredicate([this](const FArenaCard& C){return CanPlay(C,true);});}
  if(Index==INDEX_NONE){Draw();return;}Play(Index,Left);
 }
 if(Pending!=INDEX_NONE){TArray<int32> Options;int32 N=IsHandChoice()?Players[Turn].Hand.Num():Players.Num();for(int32 I=0;I<N;++I)if(IsValidChoice(I))Options.Add(I);if(Options.Num())Choose(Options[FMath::RandRange(0,Options.Num()-1)]);else FinishTurn();}
}
