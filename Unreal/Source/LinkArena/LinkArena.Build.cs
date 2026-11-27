using UnrealBuildTool;
public class LinkArena : ModuleRules {
 public LinkArena(ReadOnlyTargetRules Target) : base(Target) { PCHUsage=PCHUsageMode.UseExplicitOrSharedPCHs; PublicDependencyModuleNames.AddRange(new string[]{"Core","CoreUObject","Engine","InputCore","Slate","SlateCore","ApplicationCore"}); }
}