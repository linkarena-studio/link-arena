#pragma once
#include "CoreMinimal.h"

struct FArenaCard {
 int32 Id=0, Type=0, Left=1, Right=1, Color=0;
};
struct FArenaPlayer {
 TArray<FArenaCard> Hand;
 bool Shield=false;
};
struct FArenaRules {
 TArray<FArenaPlayer> Players;
 TArray<FArenaCard> Board;
 int32 Turn=0, Direction=1, Skip=INDEX_NONE, Winner=INDEX_NONE, Pending=INDEX_NONE;
 int32 LastId=0, NextId=1;
 bool bLastLeft=false, bBonus=false;
 FString Log;
 void Start();
 FArenaCard NewCard();
 int32 VisibleStart() const;
 int32 VisibleCount() const { return FMath::Min(3,Board.Num()); }
 bool CanPlay(const FArenaCard& Card,bool Left) const;
 bool Play(int32 Index,bool Left);
 bool Draw();
 bool Choose(int32 Index);
 void CpuMove();
 void FinishTurn();
 void Attack(int32 Player,int32 Count);
 int32 Next() const {return (Turn+Direction+Players.Num())%Players.Num();}
 bool IsHandChoice() const {return Pending==4||Pending==6||Pending==7||Pending==14;}
 bool IsValidChoice(int32 Index) const;
 static FString Name(int32 Type);
 static FString Description(int32 Type);
 static FString Person(int32 Index){return Index==0?TEXT("あなた"):FString::Printf(TEXT("CPU %d"),Index);}
};
