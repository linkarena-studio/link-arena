#pragma once
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "LinkArenaMode.generated.h"
UCLASS()
class LINKARENA_API ALinkArenaMode : public AGameModeBase {
 GENERATED_BODY()
 public:
 virtual void BeginPlay() override;
 virtual void EndPlay(const EEndPlayReason::Type Reason) override;
 private:
 TSharedPtr<class SArenaView> ArenaView;
};