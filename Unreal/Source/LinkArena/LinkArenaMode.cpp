#include "LinkArenaMode.h"
#include "ArenaRules.h"
#include "Engine/Engine.h"
#include "Engine/GameViewportClient.h"
#include "GameFramework/PlayerController.h"
#include "Widgets/SCompoundWidget.h"
#include "Widgets/SBoxPanel.h"
#include "Widgets/Layout/SBorder.h"
#include "Widgets/Layout/SBox.h"
#include "Widgets/Layout/SScrollBox.h"
#include "Widgets/Input/SButton.h"
#include "Widgets/Text/STextBlock.h"
#include "Rendering/DrawElements.h"
#include "Styling/CoreStyle.h"

class SArenaCard : public SCompoundWidget {
public:
 SLATE_BEGIN_ARGS(SArenaCard){} SLATE_END_ARGS()
 void Construct(const FArguments&,FArenaCard InCard,bool bInSelected){
  Card=InCard;bSelected=bInSelected;
  ChildSlot[SNew(SBox).WidthOverride(108).HeightOverride(128)
   [SNew(SVerticalBox)
    +SVerticalBox::Slot().FillHeight(1).VAlign(VAlign_Center).HAlign(HAlign_Center)
    [SNew(STextBlock).Text(FText::FromString(FString::Printf(TEXT("%02d"),Card.Type+1))).Font(FCoreStyle::GetDefaultFontStyle("Bold",24)).ColorAndOpacity(FSlateColor(FLinearColor(0.06f,0.18f,0.12f)))]
    +SVerticalBox::Slot().AutoHeight().Padding(17,0,12,16).HAlign(HAlign_Center)
    [SNew(STextBlock).Text(FText::FromString(FArenaRules::Name(Card.Type))).AutoWrapText(true).Justification(ETextJustify::Center).Font(FCoreStyle::GetDefaultFontStyle("Bold",12)).ColorAndOpacity(FSlateColor(FLinearColor(0.06f,0.18f,0.12f)))]]];
 }
 virtual int32 OnPaint(const FPaintArgs& Args,const FGeometry& Geo,const FSlateRect& Cull,FSlateWindowElementList& Out,int32 Layer,const FWidgetStyle& Style,bool Enabled) const override {
  const FVector2D Sz=Geo.GetLocalSize();
  static const FLinearColor Colors[]={FLinearColor(.86f,.61f,.23f),FLinearColor(.40f,.73f,.88f),FLinearColor(.89f,.43f,.50f),FLinearColor(.46f,.75f,.39f),FLinearColor(.65f,.42f,.83f)};
  const FLinearColor C=Colors[FMath::Clamp(Card.Color,0,4)];
  const auto* Brush=FCoreStyle::Get().GetBrush("WhiteBrush");
  const float W=Sz.X,H=Sz.Y;
  auto Box=[&](float X,float Y,float BW,float BH,FLinearColor Col,int32 Z){FSlateDrawElement::MakeBox(Out,Z,Geo.ToPaintGeometry(FVector2D(BW,BH),FSlateLayoutTransform(FVector2D(X,Y))),Brush,ESlateDrawEffect::None,Col);};
  Box(W*.14f,0,W*.70f,H,FLinearColor(.25f,.16f,.07f),Layer);
  Box(W*.16f,2,W*.66f,H-4,C,Layer+1);
  for(int32 I=0;I<3;++I){
   float Y=H*(.18f+.28f*I);
   if(Card.Right&(1<<I)){Box(W*.80f,Y,W*.18f,H*.14f,FLinearColor(.25f,.16f,.07f),Layer);Box(W*.79f,Y+2,W*.17f,H*.14f-4,C,Layer+1);}
   if(Card.Left&(1<<I))Box(W*.13f,Y,W*.13f,H*.14f,FLinearColor(.025f,.17f,.105f),Layer+2);
  }
  if(bSelected){TArray<FVector2D> P={{2,2},{W-2,2},{W-2,H-2},{2,H-2},{2,2}};FSlateDrawElement::MakeLines(Out,Layer+3,Geo.ToPaintGeometry(),P,ESlateDrawEffect::None,FLinearColor(1,.86f,.25f),true,2);}
  return SCompoundWidget::OnPaint(Args,Geo,Cull,Out,Layer+4,Style,Enabled);
 }
private: FArenaCard Card;bool bSelected=false;
};

class SArenaView : public SCompoundWidget {
public:
 SLATE_BEGIN_ARGS(SArenaView){} SLATE_END_ARGS()
 void Construct(const FArguments&){
  Rules.Start();
  ChildSlot[SNew(SBorder).BorderImage(FCoreStyle::Get().GetBrush("WhiteBrush")).BorderBackgroundColor(FLinearColor(.025f,.17f,.105f)).Padding(12)
   [SAssignNew(Root,SVerticalBox)]];
  Refresh();
  RegisterActiveTimer(.15f,FWidgetActiveTimerDelegate::CreateSP(this,&SArenaView::TickCPU));
 }
private:
 FArenaRules Rules; int32 Selected=INDEX_NONE; double CpuAt=0;
 TSharedPtr<SVerticalBox> Root;
 TSharedRef<STextBlock> Label(const FString& T,int32 Size=16){
  return SNew(STextBlock).Text(FText::FromString(T)).Font(FCoreStyle::GetDefaultFontStyle("Bold",Size)).ColorAndOpacity(FSlateColor(FLinearColor(1,.90f,.68f))).AutoWrapText(true);
 }
 TSharedRef<SButton> Button(const FString& T,TFunction<void()> Fn,bool Enabled=true){
  return SNew(SButton).IsEnabled(Enabled).HAlign(HAlign_Center).ContentPadding(FMargin(12,8)).OnClicked_Lambda([Fn](){Fn();return FReply::Handled();})[SNew(STextBlock).Text(FText::FromString(T)).Font(FCoreStyle::GetDefaultFontStyle("Bold",14))];
 }
 bool Human() const{return Rules.Turn==0&&Rules.Winner==INDEX_NONE;}
 void DoPlay(bool Left){if(Human()&&Rules.Play(Selected,Left)){Selected=INDEX_NONE;Refresh();}}
 EActiveTimerReturnType TickCPU(double Now,float Delta){
  if(Rules.Winner==INDEX_NONE&&Rules.Turn!=0&&Now>=CpuAt){CpuAt=Now+.65;Rules.CpuMove();Selected=INDEX_NONE;Refresh();}
  return EActiveTimerReturnType::Continue;
 }
 void Refresh(){
  Root->ClearChildren();
  Root->AddSlot().AutoHeight().Padding(4)[Label(TEXT("LINK ARENA  ·  2D Unreal Edition"),22)];
  auto Opp=SNew(SHorizontalBox);
  for(int32 I=1;I<4;++I){
   FString T=FString::Printf(TEXT("%sCPU %d  %d枚%s"),Rules.Turn==I?TEXT("▶ "):TEXT(""),I,Rules.Players[I].Hand.Num(),Rules.Players[I].Shield?TEXT(" 盾"):TEXT(""));
   Opp->AddSlot().FillWidth(1).Padding(3).HAlign(HAlign_Center)[Label(T)];
  }
  Root->AddSlot().AutoHeight()[Opp];
  auto Board=SNew(SHorizontalBox);
  for(int32 I=0;I<Rules.VisibleCount();++I)Board->AddSlot().AutoWidth().Padding(0,4)[SNew(SArenaCard,Rules.Board[Rules.VisibleStart()+I],false)];
  Root->AddSlot().FillHeight(1).VAlign(VAlign_Center).HAlign(HAlign_Center)[Board];
  const FString TurnText=Rules.Winner!=INDEX_NONE?FArenaRules::Person(Rules.Winner)+TEXT("の勝利！"):FArenaRules::Person(Rules.Turn)+TEXT("の番");
  Root->AddSlot().AutoHeight().Padding(4)[Label(TurnText+FString::Printf(TEXT("　手札 %d枚"),Rules.Players[0].Hand.Num()),18)];
  auto Hand=SNew(SScrollBox).Orientation(Orient_Horizontal);
  for(int32 I=0;I<Rules.Players[0].Hand.Num();++I){
   Hand->AddSlot().Padding(3)[SNew(SButton).ContentPadding(0).IsEnabled(Human()).OnClicked_Lambda([this,I](){if(Rules.Pending!=INDEX_NONE&&Rules.IsHandChoice()){Rules.Choose(I);Selected=INDEX_NONE;}else if(Rules.Pending==INDEX_NONE)Selected=I;Refresh();return FReply::Handled();})[SNew(SArenaCard,Rules.Players[0].Hand[I],Selected==I)]];
  }
  Root->AddSlot().AutoHeight()[Hand];
  auto Actions=SNew(SHorizontalBox);
  if(Rules.Winner!=INDEX_NONE){
   Actions->AddSlot().FillWidth(1)[Button(TEXT("もう一度プレイ"),[this](){Rules.Start();Selected=INDEX_NONE;Refresh();})];
  }else if(Human()&&Rules.Pending!=INDEX_NONE){
   if(Rules.IsHandChoice())Actions->AddSlot().FillWidth(1)[Label(FArenaRules::Name(Rules.Pending)+TEXT("：手札を選択してください"))];
   else for(int32 I=1;I<4;++I)if(Rules.IsValidChoice(I))Actions->AddSlot().FillWidth(1).Padding(3)[Button(FArenaRules::Person(I),[this,I](){Rules.Choose(I);Selected=INDEX_NONE;Refresh();})];
  }else{
   bool Valid=Human()&&Rules.Players[0].Hand.IsValidIndex(Selected);
   Actions->AddSlot().FillWidth(1).Padding(3)[Button(TEXT("◀ 左につなぐ"),[this](){DoPlay(true);},Valid&&Rules.CanPlay(Rules.Players[0].Hand[Selected],true))];
   Actions->AddSlot().FillWidth(1).Padding(3)[Button(TEXT("右につなぐ ▶"),[this](){DoPlay(false);},Valid&&Rules.CanPlay(Rules.Players[0].Hand[Selected],false))];
   Actions->AddSlot().FillWidth(1).Padding(3)[Button(TEXT("山札から1枚"),[this](){if(Human()){Rules.Draw();Selected=INDEX_NONE;Refresh();}},Human())];
  }
  Root->AddSlot().AutoHeight().Padding(0,6)[Actions];
  if(Rules.Players[0].Hand.IsValidIndex(Selected))Root->AddSlot().AutoHeight()[Label(FArenaRules::Description(Rules.Players[0].Hand[Selected].Type),13)];
  Root->AddSlot().AutoHeight().Padding(4)[Label(Rules.Log,13)];
 }
};
void ALinkArenaMode::BeginPlay(){
 Super::BeginPlay();
 if(GEngine&&GEngine->GameViewport){
  ArenaView=SNew(SArenaView);
  GEngine->GameViewport->AddViewportWidgetContent(ArenaView.ToSharedRef(),100);
  if(auto* PC=GetWorld()->GetFirstPlayerController()){PC->bShowMouseCursor=true;FInputModeGameAndUI Input;PC->SetInputMode(Input);}
 }
}
void ALinkArenaMode::EndPlay(const EEndPlayReason::Type Reason){
 if(ArenaView.IsValid()&&GEngine&&GEngine->GameViewport)GEngine->GameViewport->RemoveViewportWidgetContent(ArenaView.ToSharedRef());
 ArenaView.Reset();Super::EndPlay(Reason);
}
