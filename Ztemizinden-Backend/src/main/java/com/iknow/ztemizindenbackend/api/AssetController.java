package com.iknow.ztemizindenbackend.api;

import com.iknow.ztemizindenbackend.application.AssetService;
import com.iknow.ztemizindenbackend.application.AssetService.CreateAssetCommand;
import com.iknow.ztemizindenbackend.application.CurrentUser;
import com.iknow.ztemizindenbackend.domain.Asset;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/assets")
public class AssetController {
    private final AssetService assetService;
    private final CurrentUser currentUser;

    @GetMapping
    public List<AssetResponse> list(@RequestParam String ownerId) {
        return assetService.listForOwner(currentUser.customerId(ownerId)).stream().map(AssetResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AssetResponse create(@Valid @RequestBody CreateAssetRequest request) {
        Asset asset = assetService.create(new CreateAssetCommand(
                currentUser.customerId(request.ownerId()),
                request.name(),
                request.tagNo(),
                ApiEnums.assetType(request.type()),
                request.brand(),
                request.model(),
                request.serialNumber(),
                request.purchaseDate(),
                request.warrantyEndDate(),
                request.location(),
                request.department(),
                request.description()
        ));
        return AssetResponse.from(asset);
    }

    public record CreateAssetRequest(
            @NotBlank String ownerId,
            @NotBlank String name,
            @NotBlank String tagNo,
            @NotBlank String type,
            @NotBlank String brand,
            @NotBlank String model,
            @NotBlank String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            String location,
            String department,
            String description
    ) {
    }

    public record AssetResponse(
            String id,
            String ownerId,
            String name,
            String tagNo,
            String type,
            String brand,
            String model,
            String serialNumber,
            LocalDate purchaseDate,
            LocalDate warrantyEndDate,
            String status,
            String location,
            String department,
            String description,
            Instant createdAt,
            Instant updatedAt
    ) {
        static AssetResponse from(Asset asset) {
            return new AssetResponse(
                    asset.getId(),
                    asset.getOwnerId(),
                    asset.getName(),
                    asset.getTagNo(),
                    ApiEnums.display(asset.getType()),
                    asset.getBrand(),
                    asset.getModel(),
                    asset.getSerialNumber(),
                    asset.getPurchaseDate(),
                    asset.getWarrantyEndDate(),
                    ApiEnums.display(asset.getStatus()),
                    asset.getLocation(),
                    asset.getDepartment(),
                    asset.getDescription(),
                    asset.getCreatedAt(),
                    asset.getUpdatedAt()
            );
        }
    }
}
