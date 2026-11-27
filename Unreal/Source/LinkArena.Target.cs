using UnrealBuildTool;
public class LinkArenaTarget : TargetRules {
 public LinkArenaTarget(TargetInfo Target) : base(Target) { Type=TargetType.Game; DefaultBuildSettings=BuildSettingsVersion.V5; ExtraModuleNames.Add("LinkArena"); }
}